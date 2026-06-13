import React from 'react'
import { motion } from 'framer-motion'
import { CheckSquare, User, Calendar, AlertTriangle } from 'lucide-react'

const priorityConfig = {
  High:   { cls: 'tag-red',    dot: 'bg-danger' },
  Medium: { cls: 'tag-amber',  dot: 'bg-amber' },
  Low:    { cls: 'tag-green',  dot: 'bg-success' },
}

export default function ActionItemsCard({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="card h-full">
        <div className="section-label mb-4 flex items-center gap-2">
          <CheckSquare size={14} /> Action Items
        </div>
        <p className="text-muted text-sm">No action items detected.</p>
      </div>
    )
  }

  return (
    <div className="card h-full">
      <div className="section-label mb-4 flex items-center gap-2">
        <CheckSquare size={14} /> Action Items
        <span className="ml-auto tag tag-purple">{items.length}</span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => {
          const p = priorityConfig[item.priority] || priorityConfig.Low
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="bg-surface2 rounded-xl p-3.5 border border-border/60 hover:border-accent/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-text-base text-sm font-medium leading-snug flex-1">{item.task}</p>
                <span className={`tag ${p.cls} flex-shrink-0`}>{item.priority}</span>
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted">
                {item.owner && item.owner !== 'Unknown' && (
                  <span className="flex items-center gap-1">
                    <User size={10} /> {item.owner}
                  </span>
                )}
                {item.deadline && item.deadline !== 'Not specified' && (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} /> {item.deadline}
                  </span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
