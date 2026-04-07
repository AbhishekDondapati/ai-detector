import React from 'react'
import { Link } from 'react-router-dom'
import { ScanText, Zap, BookOpen, Download, Shield, ChevronRight } from 'lucide-react'
import FileUpload from '../components/FileUpload'

const features = [
  { icon: ScanText, title: 'Multi-layer Detection', desc: 'Burstiness, lexical diversity, AI phrase density, sentence patterns — 7 detection layers.' },
  { icon: Zap, title: 'Kobak et al. Dataset', desc: 'Trained on 14M+ PubMed abstracts. Uses statistically confirmed post-ChatGPT word surge data.' },
  { icon: BookOpen, title: 'Training Mode', desc: 'Practice identifying AI vs human writing with curated examples and scoring.' },
  { icon: Download, title: 'PDF Export', desc: 'Download a full analysis report with section breakdown and recommendations.' },
  { icon: Shield, title: 'Rewrite Suggestions', desc: 'Click any flagged sentence to get a human-like rewrite via Claude API.' },
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative bg-gradient-to-b from-slate-900 via-brand-900 to-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#6366f133_0%,transparent_70%)]" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Powered by Kobak et al. 2024 Research + Claude AI
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-tight">
            Detect AI Writing in
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-purple-400">
              Academic Papers
            </span>
          </h1>
          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Upload your PDF or DOCX to get per-sentence AI probability scores, color-coded highlights,
            humanization analysis, and rewrite suggestions — all in seconds.
          </p>

          {/* Upload component */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8">
            <FileUpload />
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 mb-3">How It Works</h2>
          <p className="text-slate-500">Seven detection layers analyzed in under 2 seconds</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-16">
          {[
            { step: '1', title: 'Upload', desc: 'Drop your PDF or DOCX file. Text is extracted and preprocessed automatically.', icon: '📄' },
            { step: '2', title: 'Analyze', desc: 'Our engine runs burstiness, lexical diversity, AI phrase detection across all sentences.', icon: '🔍' },
            { step: '3', title: 'Review', desc: 'Get color-coded sentences, section scores, rewrite suggestions, and a PDF report.', icon: '📊' },
          ].map(({ step, title, desc, icon }) => (
            <div key={step} className="card text-center relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-brand-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                {step}
              </div>
              <div className="text-4xl mb-3 mt-2">{icon}</div>
              <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Detection methods */}
        <div className="card mb-12">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Detection Methods</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: 'AI Word Density', desc: '450+ known AI words from Kobak et al. biomedical corpus study', weight: 'High' },
              { name: 'AI Phrase Detection', desc: '220+ phrases: "delve into", "it is important to note", "multifaceted approach"', weight: 'High' },
              { name: 'Burstiness Score', desc: 'Measures sentence length variation. Humans are bursty; AI is uniform.', weight: 'Medium' },
              { name: 'Lexical Diversity (TTR)', desc: 'Type-token ratio. AI tends to reuse words more than humans.', weight: 'Medium' },
              { name: 'Sentence Pattern Match', desc: 'Detects AI structural patterns: tricolon lists, rigid transitions, roadmap sentences.', weight: 'High' },
              { name: 'Passive Voice Density', desc: 'AI overuses passive constructions vs. active human writing.', weight: 'Low' },
              { name: 'Readability Analysis', desc: 'Flesch-Kincaid score consistency. AI maintains unnaturally uniform complexity.', weight: 'Low' },
            ].map(({ name, desc, weight }) => (
              <div key={name} className="flex gap-3 p-3 rounded-xl bg-slate-50">
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  weight === 'High' ? 'bg-red-400' : weight === 'Medium' ? 'bg-amber-400' : 'bg-emerald-400'
                }`} />
                <div>
                  <div className="font-medium text-slate-700 text-sm">{name}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card-sm flex gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-brand-500" />
              </div>
              <div>
                <div className="font-semibold text-slate-700 text-sm mb-1">{title}</div>
                <div className="text-xs text-slate-500 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/training" className="btn-primary text-base px-8 py-3">
            <BookOpen size={18} />
            Try Training Mode
            <ChevronRight size={16} />
          </Link>
          <p className="text-slate-400 text-sm mt-4">Practice spotting AI writing with interactive examples</p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        <p>Built by <strong>AbhishekDondapati</strong> · Based on Kobak et al. (2024) arXiv research</p>
        <p className="mt-1">
          <a href="https://github.com/AbhishekDondapati/ai-detector" target="_blank" rel="noopener noreferrer"
            className="text-brand-500 hover:underline">GitHub</a>
          {' · '}
          <a href="/docs" className="text-brand-500 hover:underline">API Docs</a>
        </p>
      </div>
    </div>
  )
}
