import React from 'react'
import { motion } from 'framer-motion'
import { Key, HelpCircle, MessageCircle, Lightbulb } from 'lucide-react'

export function DecisionsCard({ decisions = [] }) {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="card h-full">
        <div className="section-label mb-4 flex items-center gap-2">
          <Key size={14} /> Key Decisions
        </div>
        <p className="text-muted text-sm">No key decisions detected.</p>
      </div>
    )
  }

  return (
    <div className="card h-full">
      <div className="section-label mb-4 flex items-center gap-2">
        <Key size={14} /> Key Decisions
        <span className="ml-auto tag tag-teal">{decisions.length}</span>
      </div>
      <div className="space-y-3">
        {decisions.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-surface2 rounded-xl p-3.5 border border-border/60 hover:border-teal/30 transition-colors"
          >
            <div className="flex items-start gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-light mt-1.5 flex-shrink-0" />
              <p className="text-text-base text-sm font-medium leading-snug">{d.decision}</p>
            </div>
            {(d.rationale || d.impact) && (
              <div className="ml-3.5 space-y-1">
                {d.rationale && (
                  <div className="flex items-start gap-1.5 text-xs text-text-dim">
                    <Lightbulb size={10} className="mt-0.5 flex-shrink-0 text-amber" />
                    <span><strong className="text-muted">Rationale:</strong> {d.rationale}</span>
                  </div>
                )}
                {d.impact && (
                  <div className="flex items-start gap-1.5 text-xs text-text-dim">
                    <span className="text-muted text-xs">↳ Impact: {d.impact}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export function QuestionsCard({ questions = [] }) {
  if (!questions || questions.length === 0) {
    return (
      <div className="card h-full">
        <div className="section-label mb-4 flex items-center gap-2">
          <HelpCircle size={14} /> Open Questions
        </div>
        <p className="text-muted text-sm">No open questions detected.</p>
      </div>
    )
  }

  return (
    <div className="card h-full">
      <div className="section-label mb-4 flex items-center gap-2">
        <HelpCircle size={14} /> Open Questions
        <span className="ml-auto tag tag-amber">{questions.length}</span>
      </div>
      <div className="space-y-3">
        {questions.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className="bg-surface2 rounded-xl p-3.5 border border-border/60 hover:border-amber/30 transition-colors"
          >
            <div className="flex items-start gap-2 mb-1.5">
              <span className="text-amber text-xs font-mono mt-0.5">?</span>
              <p className="text-text-base text-sm font-medium leading-snug">{q.question}</p>
            </div>
            <div className="ml-3.5 space-y-1">
              {q.context && (
                <p className="text-xs text-text-dim leading-relaxed">{q.context}</p>
              )}
              {q.raised_by && q.raised_by !== 'Unknown' && (
                <div className="flex items-center gap-1 text-xs text-muted">
                  <MessageCircle size={9} />
                  <span>Raised by {q.raised_by}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
