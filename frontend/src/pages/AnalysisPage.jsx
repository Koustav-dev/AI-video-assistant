import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Youtube, Upload, Languages, Zap, AlertCircle,
  CheckCircle2, ChevronRight, ExternalLink
} from 'lucide-react'
import { useVideoAnalysis } from '../hooks/useVideoAnalysis'
import PipelinePanel from '../components/PipelinePanel'
import SummaryCard from '../components/SummaryCard'
import ActionItemsCard from '../components/ActionItemsCard'
import { DecisionsCard, QuestionsCard } from '../components/InsightCards'
import ChatPanel from '../components/ChatPanel'

const LANG_OPTIONS = [
  { value: 'english', label: '🇬🇧 English' },
  { value: 'hinglish', label: '🇮🇳 Hinglish → English' },
]

function TitleBanner({ title }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong rounded-2xl px-6 py-4 flex items-center gap-3 border-accent/30"
    >
      <div className="w-2 h-10 rounded-full bg-gradient-to-b from-accent to-teal flex-shrink-0" />
      <div>
        <div className="section-label">Session Title</div>
        <div className="font-display font-bold text-xl text-text-base mt-0.5">{title}</div>
      </div>
    </motion.div>
  )
}

function EmptyState({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 text-center px-4"
    >
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-accent/20 to-teal/10 border border-accent/20 flex items-center justify-center">
          <Zap size={40} className="text-accent-light" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent animate-pulse" />
      </div>
      <h2 className="font-display font-bold text-2xl text-text-base mb-3">
        Ready to Analyse
      </h2>
      <p className="text-text-dim max-w-md mb-8 leading-relaxed">
        Paste a YouTube URL or enter a local file path in the panel above, pick your language, and hit <strong className="text-text-base">Analyse</strong>.
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {['Groq Whisper Transcription', 'llama Summarisation', 'Gemini RAG Chat', 'Structured Insights'].map(f => (
          <span key={f} className="tag tag-purple text-xs">{f}</span>
        ))}
      </div>
    </motion.div>
  )
}

export default function AnalysisPage() {
  const {
    status, steps, result, errorMsg,
    chatHistory, chatLoading,
    startAnalysis, sendMessage, clearChat,
    STEPS,
  } = useVideoAnalysis()

  const [source, setSource] = useState('')
  const [language, setLanguage] = useState('english')
  const [activeTab, setActiveTab] = useState('summary')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!source.trim()) return
    startAnalysis(source.trim(), language)
  }

  const tabs = [
    { id: 'summary',   label: 'Summary',         count: null },
    { id: 'actions',   label: 'Actions',          count: result?.action_items?.length },
    { id: 'decisions', label: 'Decisions',        count: result?.key_decisions?.length },
    { id: 'questions', label: 'Questions',        count: result?.open_questions?.length },
  ]

  const isRunning = status === 'running'
  const isDone    = status === 'done'

  return (
    <div className="pt-24 pb-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="section-label mb-2">AI Analysis Studio</div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-text-base">
            Video <span className="gradient-text">Intelligence</span>
          </h1>
        </div>

        {/* ── Input form + pipeline ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Input panel */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6">
              <div className="section-label mb-4">Input Source</div>

              {/* Source input */}
              <div className="relative mb-4">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
                  <Youtube size={16} />
                </div>
                <input
                  type="text"
                  value={source}
                  onChange={e => setSource(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or /path/to/file.mp4"
                  disabled={isRunning}
                  className="input-field pl-10"
                />
              </div>

              {/* Language select */}
              <div className="flex items-center gap-3 mb-5">
                <Languages size={16} className="text-muted flex-shrink-0" />
                <div className="flex gap-2">
                  {LANG_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLanguage(opt.value)}
                      disabled={isRunning}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        language === opt.value
                          ? 'bg-accent/20 border border-accent/40 text-accent-light'
                          : 'bg-surface2 border border-border text-text-dim hover:border-accent/30'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isRunning || !source.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Analyse Video
                  </>
                )}
              </button>

              {/* Error */}
              <AnimatePresence>
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 flex items-start gap-2.5 bg-danger/10 border border-danger/25 rounded-xl p-3.5"
                  >
                    <AlertCircle size={16} className="text-danger flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-danger text-sm font-medium">Pipeline Error</p>
                      <p className="text-danger/80 text-xs mt-0.5 font-mono">{errorMsg}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Done banner */}
              <AnimatePresence>
                {isDone && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 flex items-center gap-2 bg-success/10 border border-success/25 rounded-xl p-3"
                  >
                    <CheckCircle2 size={15} className="text-success" />
                    <span className="text-success text-sm font-medium">Analysis complete</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Pipeline status */}
          <div>
            <PipelinePanel steps={steps} STEPS={STEPS} status={status} />
          </div>
        </div>

        {/* ── Results ─────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {(isDone || (isRunning && result)) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {/* Title */}
              {result?.title && <TitleBanner title={result.title} />}

              {/* Main grid: insights + chat */}
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

                {/* Insights (3/5) */}
                <div className="xl:col-span-3 space-y-4">

                  {/* Tab bar */}
                  <div className="flex items-center gap-1 bg-surface border border-border rounded-xl p-1">
                    {tabs.map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                          activeTab === tab.id
                            ? 'bg-surface2 text-text-base border border-border shadow-sm'
                            : 'text-text-dim hover:text-text-base'
                        }`}
                      >
                        {tab.label}
                        {tab.count != null && tab.count > 0 && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-md font-mono ${
                            activeTab === tab.id ? 'bg-accent/20 text-accent-light' : 'bg-surface2 text-muted'
                          }`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Tab content */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === 'summary' && (
                        <SummaryCard
                          summary={result?.summary}
                          transcript={result?.transcript}
                        />
                      )}
                      {activeTab === 'actions' && (
                        <ActionItemsCard items={result?.action_items} />
                      )}
                      {activeTab === 'decisions' && (
                        <DecisionsCard decisions={result?.key_decisions} />
                      )}
                      {activeTab === 'questions' && (
                        <QuestionsCard questions={result?.open_questions} />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Chat (2/5) */}
                <div className="xl:col-span-2">
                  <ChatPanel
                    chatHistory={chatHistory}
                    chatLoading={chatLoading}
                    onSend={sendMessage}
                    onClear={clearChat}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Empty state ─────────────────────────────────────────────────── */}
        {status === 'idle' && <EmptyState />}
      </div>
    </div>
  )
}
