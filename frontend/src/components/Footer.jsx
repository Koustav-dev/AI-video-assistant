import React from 'react'
import { Link } from 'react-router-dom'
import { Zap, Github, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-border/50 bg-surface/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent to-purple-700 flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-display font-bold text-text-base">VidAI</span>
            </div>
            <p className="text-text-dim text-sm leading-relaxed">
              AI-powered video intelligence. Transcribe, summarize, and chat with any video or meeting.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="section-label mb-4">Navigation</h4>
            <ul className="space-y-2">
              {[
                { label: 'Home', to: '/' },
                { label: 'Analyse Video', to: '/analyse' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-text-dim text-sm hover:text-accent-light transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack */}
          <div>
            <h4 className="section-label mb-4">Powered By</h4>
            <div className="flex flex-wrap gap-2">
              {['Groq Whisper', 'llama AI', 'Gemini Embeddings', 'ChromaDB', 'FastAPI', 'React'].map(t => (
                <span key={t} className="tag tag-purple text-xs">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-muted text-xs font-mono">
            © 2025 VidAI — AI Video Assistant
          </p>
          <p className="text-muted text-xs flex items-center gap-1.5">
            Built with <Heart size={11} className="text-accent-light" /> using Groq + llama + Gemini
          </p>
        </div>
      </div>
    </footer>
  )
}
