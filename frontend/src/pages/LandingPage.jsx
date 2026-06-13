import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Zap, Brain, MessageSquare, FileText, ChevronRight,
  Youtube, Mic, Layers, TrendingUp, Shield, Clock,
  CheckCircle2, ArrowRight, Sparkles
} from 'lucide-react'

/* ── animation variants ─────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: 'easeOut' }
  }),
}

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
}

function AnimSection({ children, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  )
}

/* ── Feature data ─────────────────────────────────────────────────────────── */
const features = [
  {
    icon: <Mic size={22} />,
    title: 'Groq Whisper Transcription',
    desc: 'Lightning-fast speech-to-text via Groq\'s Whisper large-v3 API — free, accurate, multilingual.',
    tag: 'Free API',
    color: 'from-purple-500 to-purple-700',
    glow: 'rgba(124,58,237,0.3)',
  },
  {
    icon: <FileText size={22} />,
    title: 'Intelligent Summarisation',
    desc: 'llama large generates structured summaries, action items, key decisions and open questions.',
    tag: 'llama AI',
    color: 'from-teal-500 to-teal-700',
    glow: 'rgba(20,184,166,0.3)',
  },
  {
    icon: <Brain size={22} />,
    title: 'Gemini RAG Engine',
    desc: 'Google Gemini Embedding 2 Preview powers semantic search over your transcript with MMR retrieval.',
    tag: 'Gemini Embeddings',
    color: 'from-blue-500 to-blue-700',
    glow: 'rgba(59,130,246,0.3)',
  },
  {
    icon: <MessageSquare size={22} />,
    title: 'Conversational Chat',
    desc: 'Ask anything about your meeting. The agentic RAG chain retrieves relevant context and answers precisely.',
    tag: 'Agentic RAG',
    color: 'from-pink-500 to-pink-700',
    glow: 'rgba(236,72,153,0.3)',
  },
  {
    icon: <Layers size={22} />,
    title: 'Live Pipeline Dashboard',
    desc: 'Watch every processing step in real time — audio download, transcription, extraction, RAG build.',
    tag: 'SSE Streaming',
    color: 'from-amber-500 to-amber-700',
    glow: 'rgba(245,158,11,0.3)',
  },
  {
    icon: <TrendingUp size={22} />,
    title: 'Structured Insights',
    desc: 'JSON-parsed action items with owner/deadline/priority, decisions with rationale, questions with context.',
    tag: 'Structured Output',
    color: 'from-green-500 to-green-700',
    glow: 'rgba(16,185,129,0.3)',
  },
]

const steps = [
  { n: '01', title: 'Paste URL or File', desc: 'Drop a YouTube URL or local video/audio file path.' },
  { n: '02', title: 'AI Processes', desc: 'Groq Whisper transcribes, llama analyses, Gemini indexes.' },
  { n: '03', title: 'Explore Insights', desc: 'View summary, action items, decisions, and open questions.' },
  { n: '04', title: 'Chat with Content', desc: 'Ask questions — the RAG engine retrieves precise answers.' },
]

const stats = [
  { value: 'Whisper V3', label: 'Transcription model' },
  { value: '~60×', label: 'Faster than local Whisper' },
  { value: 'MMR', label: 'RAG retrieval strategy' },
  { value: '100%', label: 'Free API tier' },
]

/* ── Landing page ─────────────────────────────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="pt-20">
      {/* ── Hero ── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* grid bg */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-50 pointer-events-none" />

        {/* glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-teal/8 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="relative z-10 text-center max-w-4xl mx-auto"
        >
          {/* badge */}
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/30 bg-accent/8 mb-8">
            <Sparkles size={14} className="text-accent-light" />
            <span className="text-accent-light font-mono text-xs font-medium tracking-wide">
              Powered by Groq · llama · Gemini Embeddings
            </span>
          </motion.div>

          {/* headline */}
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl md:text-7xl font-bold leading-[1.05] mb-6"
          >
            <span className="gradient-text">AI Intelligence</span>
            <br />
            <span className="text-text-base">for Every Video</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-text-dim text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Transcribe any YouTube video or local file with Groq Whisper.
            Extract insights with llama AI. Chat with your content using Gemini-powered agentic RAG.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/analyse" className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-4">
              <Zap size={18} />
              Start Analysing Free
            </Link>
            <a
              href="https://github.com/AkarshVyas/AI-Video-Assistant-"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost flex items-center justify-center gap-2 text-base"
            >
              View on GitHub
              <ArrowRight size={16} />
            </a>
          </motion.div>
        </motion.div>

        {/* floating cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="relative z-10 mt-20 w-full max-w-3xl mx-auto"
        >
          <div className="glass rounded-2xl p-5 shadow-[0_0_80px_rgba(124,58,237,0.12)]">
            {/* mock pipeline */}
            <div className="section-label mb-4">Pipeline Preview</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { label: 'Audio Download', status: 'done', info: 'yt-dlp + ffmpeg' },
                { label: 'Whisper Transcription', status: 'done', info: '1,243 words' },
                { label: 'Title Generation', status: 'done', info: 'llama large' },
                { label: 'Summarisation', status: 'done', info: 'Structured output' },
                { label: 'Insight Extraction', status: 'done', info: '5 actions, 3 decisions' },
                { label: 'Gemini RAG Build', status: 'active', info: 'Embedding…' },
              ].map((step, i) => (
                <div
                  key={i}
                  className={`pipeline-step text-xs ${step.status === 'active' ? 'active' : 'done'}`}
                >
                  <div className={`step-dot ${step.status}`} />
                  <div>
                    <div className="text-text-base font-medium">{step.label}</div>
                    <div className="text-muted mt-0.5">{step.info}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 border-y border-border/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div className="font-display font-bold text-2xl md:text-3xl gradient-text mb-1">{s.value}</div>
              <div className="text-muted text-xs font-mono uppercase tracking-wide">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <AnimSection className="text-center mb-16">
            <motion.div variants={fadeUp} className="section-label mb-3">Capabilities</motion.div>
            <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl md:text-4xl text-text-base mb-4">
              Everything you need to understand your videos
            </motion.h2>
            <motion.p variants={fadeUp} className="text-text-dim max-w-2xl mx-auto">
              A full agentic pipeline from raw audio to structured, searchable intelligence — powered by best-in-class free APIs.
            </motion.p>
          </AnimSection>

          <AnimSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                whileHover={{ y: -4 }}
                className="card group cursor-default"
                style={{ '--glow': f.glow }}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-4 shadow-lg`}
                  style={{ boxShadow: `0 4px 20px ${f.glow}` }}
                >
                  {f.icon}
                </div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-display font-semibold text-text-base">{f.title}</h3>
                  <span className="tag tag-purple text-xs flex-shrink-0">{f.tag}</span>
                </div>
                <p className="text-text-dim text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </AnimSection>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 bg-surface/30 border-y border-border/50">
        <div className="max-w-5xl mx-auto">
          <AnimSection className="text-center mb-16">
            <motion.div variants={fadeUp} className="section-label mb-3">How It Works</motion.div>
            <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl md:text-4xl text-text-base">
              Four steps to video intelligence
            </motion.h2>
          </AnimSection>

          <AnimSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="relative">
                <div className="glass rounded-2xl p-6 h-full">
                  <div className="font-mono text-4xl font-bold text-accent/20 mb-3">{s.n}</div>
                  <h3 className="font-display font-semibold text-text-base mb-2">{s.title}</h3>
                  <p className="text-text-dim text-sm leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ChevronRight size={20} className="text-accent/40" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-strong rounded-3xl p-12 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-teal/5 pointer-events-none" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-purple-700 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(124,58,237,0.4)] animate-glow">
                <Zap size={28} className="text-white" />
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl text-text-base mb-4">
                Ready to analyse your first video?
              </h2>
              <p className="text-text-dim mb-8 max-w-xl mx-auto">
                Paste a YouTube URL or upload your file. No local GPU required — everything runs on free cloud APIs.
              </p>
              <Link to="/analyse" className="btn-primary inline-flex items-center gap-2 px-8 py-4 text-base">
                <Zap size={18} />
                Launch Free Analysis
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
