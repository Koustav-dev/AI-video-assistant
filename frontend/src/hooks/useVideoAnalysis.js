// src/hooks/useVideoAnalysis.js
// Core hook — manages pipeline state, SSE streaming, and chat
import { useState, useCallback, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const STEPS = [
  { key: 'audio',      label: 'Downloading & Processing Audio',   icon: '🔊' },
  { key: 'transcript', label: 'Transcribing with Groq Whisper',    icon: '📝' },
  { key: 'title',      label: 'Generating Session Title',          icon: '🏷️' },
  { key: 'summary',    label: 'Summarising Content',               icon: '📋' },
  { key: 'extract',    label: 'Extracting Insights',               icon: '🔍' },
  { key: 'rag',        label: 'Building Gemini RAG Engine',         icon: '🧠' },
]

export function useVideoAnalysis() {
  const [sessionId, setSessionId]   = useState(null)
  const [status, setStatus]         = useState('idle') // idle | running | done | error
  const [steps, setSteps]           = useState({})     // key → { state, info, progress }
  const [result, setResult]         = useState(null)
  const [errorMsg, setErrorMsg]     = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const esRef = useRef(null)

  const updateStep = useCallback((key, patch) => {
    setSteps(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), ...patch }
    }))
  }, [])

  const startAnalysis = useCallback(async (source, language) => {
    // Reset
    setStatus('running')
    setSteps({})
    setResult(null)
    setErrorMsg('')
    setChatHistory([])
    if (esRef.current) { esRef.current.close(); esRef.current = null }

    // Start pipeline
    const resp = await fetch(`${API_BASE}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, language }),
    })
    if (!resp.ok) {
      const err = await resp.json()
      setStatus('error')
      setErrorMsg(err.detail || 'Failed to start pipeline')
      return
    }
    const { session_id } = await resp.json()
    setSessionId(session_id)

    // Open SSE stream
    const es = new EventSource(`${API_BASE}/stream/${session_id}`)
    esRef.current = es

    es.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data)

      if (type === 'step_start') {
        updateStep(data.step, { state: 'active', label: data.label, info: '' })
      } else if (type === 'step_done') {
        updateStep(data.step, { state: 'done', info: data.info })
      } else if (type === 'progress') {
        updateStep(data.step, {
          state: 'active',
          progress: data.pct,
          info: `${data.current}/${data.total} chunks`
        })
      } else if (type === 'transcript') {
        setResult(prev => ({ ...(prev || {}), transcript: data.text }))
      } else if (type === 'title') {
        setResult(prev => ({ ...(prev || {}), title: data.text }))
      } else if (type === 'summary') {
        setResult(prev => ({ ...(prev || {}), summary: data.text }))
      } else if (type === 'extractions') {
        setResult(prev => ({
          ...(prev || {}),
          action_items: data.action_items,
          key_decisions: data.key_decisions,
          open_questions: data.open_questions,
        }))
      } else if (type === 'done') {
        setStatus('done')
        es.close()
      } else if (type === 'error') {
        setStatus('error')
        setErrorMsg(data.message)
        es.close()
      } else if (type === '__end__') {
        es.close()
      }
    }

    es.onerror = () => {
      if (status !== 'done') {
        setStatus('error')
        setErrorMsg('Connection lost. Please try again.')
      }
      es.close()
    }
  }, [updateStep])

  const sendMessage = useCallback(async (question, includeSources = false) => {
    if (!sessionId || status !== 'done') return
    setChatLoading(true)
    setChatHistory(prev => [...prev, { role: 'user', content: question }])

    try {
      const resp = await fetch(`${API_BASE}/chat/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, include_sources: includeSources }),
      })
      const data = await resp.json()
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: data.answer, sources: data.sources || [] }
      ])
    } catch {
      setChatHistory(prev => [
        ...prev,
        { role: 'assistant', content: '⚠️ Error connecting to backend. Is the server running?', sources: [] }
      ])
    } finally {
      setChatLoading(false)
    }
  }, [sessionId, status])

  const clearChat = useCallback(() => setChatHistory([]), [])

  return {
    sessionId, status, steps, result, errorMsg,
    chatHistory, chatLoading,
    startAnalysis, sendMessage, clearChat,
    STEPS,
  }
}