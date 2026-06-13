import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Trash2, Bot, User, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const SUGGESTED = [
  'What were the main topics discussed?',
  'List all action items with owners.',
  'What decisions were made and why?',
  'Summarize in 3 bullet points.',
]

export default function ChatPanel({ chatHistory, chatLoading, onSend, onClear }) {
  const [input, setInput] = useState('')
  const [showSources, setShowSources] = useState({})
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, chatLoading])

  const handleSend = () => {
    const q = input.trim()
    if (!q || chatLoading) return
    setInput('')
    onSend(q, true)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="card flex flex-col h-[680px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-teal-light/80 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <div className="font-display font-semibold text-text-base text-sm">RAG Assistant</div>
            <div className="text-xs text-muted font-mono">Gemini Embedding · llama LLM</div>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button onClick={onClear} className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5">
            <Trash2 size={12} /> Clear
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className="w-14 h-14 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center mb-4">
              <Bot size={24} className="text-teal-light" />
            </div>
            <p className="text-text-base font-medium mb-2 font-display">Chat with your video</p>
            <p className="text-text-dim text-sm mb-6 max-w-xs">
              Ask anything about the content. The RAG engine will find relevant passages.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTED.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onSend(s, true)}
                  className="text-xs px-3 py-2 rounded-xl border border-border bg-surface2 text-text-dim hover:border-teal/40 hover:text-text-base transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {chatHistory.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                msg.role === 'user'
                  ? 'bg-accent/20 border border-accent/30'
                  : 'bg-teal/15 border border-teal/25'
              }`}>
                {msg.role === 'user'
                  ? <User size={13} className="text-accent-light" />
                  : <Bot size={13} className="text-teal-light" />
                }
              </div>

              {/* Bubble */}
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-accent/12 border border-accent/20 rounded-tr-sm'
                  : 'bg-surface2 border border-border rounded-tl-sm'
              }`}>
                <div className={`text-sm leading-relaxed prose prose-sm max-w-none ${
                  msg.role === 'user' ? 'prose-invert text-text-base' : 'prose-invert text-text-base'
                }`}>
                  {msg.role === 'assistant' ? (
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>

                {/* Sources toggle */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/40">
                    <button
                      onClick={() => setShowSources(p => ({ ...p, [i]: !p[i] }))}
                      className="flex items-center gap-1.5 text-xs text-muted hover:text-text-dim transition-colors"
                    >
                      {showSources[i] ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      {msg.sources.length} source chunk{msg.sources.length > 1 ? 's' : ''}
                    </button>
                    <AnimatePresence>
                      {showSources[i] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 space-y-2 overflow-hidden"
                        >
                          {msg.sources.map((src, j) => (
                            <div
                              key={j}
                              className="text-xs text-muted bg-bg/60 rounded-lg p-2.5 border border-border/40 font-mono leading-relaxed line-clamp-3"
                            >
                              {src}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {chatLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-teal/15 border border-teal/25 flex-shrink-0">
              <Bot size={13} className="text-teal-light" />
            </div>
            <div className="bg-surface2 border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 size={13} className="text-teal-light animate-spin" />
                <span className="text-text-dim text-sm">Searching knowledge base…</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 pt-4 border-t border-border/50">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about your video… (Enter to send)"
            rows={2}
            className="input-field flex-1 resize-none text-sm py-2.5"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatLoading}
            className="btn-primary px-4 py-2.5 self-end"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="text-muted text-xs mt-2 font-mono">
          Shift+Enter for new line · Enter to send · Sources shown per message
        </p>
      </div>
    </div>
  )
}
