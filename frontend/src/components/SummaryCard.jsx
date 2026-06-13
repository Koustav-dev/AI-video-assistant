import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function SummaryCard({ summary, transcript }) {
  const [transcriptOpen, setTranscriptOpen] = useState(false)

  return (
    <div className="card">
      {/* Summary */}
      <div className="section-label mb-4 flex items-center gap-2">
        <FileText size={14} /> Summary
      </div>
      <div className="prose prose-sm prose-invert max-w-none text-text-base leading-relaxed">
        <ReactMarkdown>{summary || 'Generating summary…'}</ReactMarkdown>
      </div>

      {/* Transcript accordion */}
      {transcript && (
        <div className="mt-5 border-t border-border/50 pt-4">
          <button
            onClick={() => setTranscriptOpen(!transcriptOpen)}
            className="flex items-center gap-2 text-sm text-text-dim hover:text-text-base transition-colors w-full"
          >
            {transcriptOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            <span className="font-mono font-medium">
              Full Transcript ({transcript.split(' ').length} words)
            </span>
          </button>
          <AnimatePresence>
            {transcriptOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 bg-surface2 rounded-xl p-4 max-h-72 overflow-y-auto border border-border/50">
                  <p className="font-mono text-xs text-text-dim leading-relaxed whitespace-pre-wrap">
                    {transcript}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
