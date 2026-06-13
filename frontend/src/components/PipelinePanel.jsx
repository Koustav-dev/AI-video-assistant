import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function PipelinePanel({ steps, STEPS, status }) {
  return (
    <div className="glass-strong rounded-2xl p-5">
      <div className="section-label mb-4">Processing Pipeline</div>
      <div className="space-y-2">
        {STEPS.map(({ key, label, icon }) => {
          const s = steps[key] || {}
          const state = s.state || 'pending'

          return (
            <motion.div
              key={key}
              layout
              className={`pipeline-step ${state === 'active' ? 'active' : state === 'done' ? 'done' : ''}`}
            >
              <div className={`step-dot ${state}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <span className="text-sm text-text-base font-medium truncate">{label}</span>
                </div>
                <AnimatePresence mode="wait">
                  {state === 'active' && s.progress != null && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-1.5"
                    >
                      <div className="w-full bg-border rounded-full h-1">
                        <motion.div
                          className="bg-accent-light h-1 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${s.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className="text-muted text-xs mt-1 block">{s.info}</span>
                    </motion.div>
                  )}
                  {state === 'active' && s.progress == null && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1.5 mt-1"
                    >
                      <Loader2 size={10} className="text-accent-light animate-spin" />
                      <span className="text-muted text-xs">Processing…</span>
                    </motion.div>
                  )}
                  {state === 'done' && s.info && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1 mt-0.5"
                    >
                      <CheckCircle2 size={10} className="text-success" />
                      <span className="text-muted text-xs">{s.info}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex-shrink-0">
                {state === 'done' && <CheckCircle2 size={14} className="text-success" />}
                {state === 'active' && <Loader2 size={14} className="text-accent-light animate-spin" />}
                {state === 'error' && <AlertCircle size={14} className="text-danger" />}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
