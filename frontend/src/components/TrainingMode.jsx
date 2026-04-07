import React, { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Brain, Trophy, RotateCcw, ChevronRight, Loader2, HelpCircle } from 'lucide-react'
import { getTrainingExamples, submitTrainingAnswer, analyzeQuickSample } from '../services/api'

const DIFFICULTY_STYLES = {
  easy:   { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Easy' },
  medium: { bg: 'bg-amber-100',   text: 'text-amber-700',   label: 'Medium' },
  hard:   { bg: 'bg-red-100',     text: 'text-red-700',     label: 'Hard' },
}

function ExampleCard({ example, onAnswer }) {
  const [showHints, setShowHints] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const ds = DIFFICULTY_STYLES[example.difficulty] || DIFFICULTY_STYLES.easy

  const handleAnswer = async (isAI) => {
    if (answered || loading) return
    setLoading(true)
    try {
      const res = await submitTrainingAnswer(example.id, isAI)
      setResult(res)
      setAnswered(true)
      onAnswer(res.score_delta)
    } catch {
      setResult({ correct: false, score_delta: 0, explanation: 'Error checking answer.', highlighted_text: example.text })
      setAnswered(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`card transition-all duration-300 ${
      answered
        ? result?.correct ? 'border-emerald-300 bg-emerald-50/30' : 'border-red-300 bg-red-50/30'
        : 'border-slate-100'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ds.bg} ${ds.text}`}>
          {ds.label}
        </span>
        <span className="text-xs text-slate-400">Example #{example.id}</span>
        {answered && (
          <span className="ml-auto">
            {result?.correct
              ? <CheckCircle2 size={20} className="text-emerald-500" />
              : <XCircle size={20} className="text-red-500" />
            }
          </span>
        )}
      </div>

      {/* Text */}
      <div className="bg-slate-50 rounded-xl p-4 mb-4 text-slate-700 leading-7 font-['Georgia',serif] text-base">
        {answered && result?.highlighted_text
          ? result.highlighted_text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <mark key={i} className="bg-amber-200 text-amber-900 rounded px-0.5 not-italic">{part.slice(2, -2)}</mark>
              }
              return <span key={i}>{part}</span>
            })
          : example.text
        }
      </div>

      {/* Hints */}
      {!answered && (
        <button
          onClick={() => setShowHints(!showHints)}
          className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1 mb-3"
        >
          <HelpCircle size={12} />
          {showHints ? 'Hide hints' : 'Show hints'}
        </button>
      )}
      {showHints && !answered && (
        <div className="bg-brand-50 rounded-xl p-3 mb-4 space-y-1">
          {example.hints.map((h, i) => (
            <div key={i} className="text-xs text-brand-700 flex gap-1.5">
              <span className="text-brand-400">💡</span> {h}
            </div>
          ))}
        </div>
      )}

      {/* Answer buttons */}
      {!answered ? (
        <div className="flex gap-3">
          <button
            onClick={() => handleAnswer(true)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold
              bg-red-100 text-red-700 hover:bg-red-200 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : '🤖'}
            AI Generated
          </button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold
              bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : '✍️'}
            Human Written
          </button>
        </div>
      ) : (
        <div className={`rounded-xl p-4 ${result?.correct ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`font-semibold mb-1 ${result?.correct ? 'text-emerald-700' : 'text-red-700'}`}>
            {result?.correct ? `✅ Correct! +${result.score_delta} points` : `❌ Incorrect! ${result?.score_delta} points`}
          </div>
          <div className="text-sm text-slate-600">{result?.explanation}</div>
          <div className="text-xs text-slate-500 mt-2">
            This text was: <strong>{result?.correct_answer ? '🤖 AI Generated' : '✍️ Human Written'}</strong>
          </div>
        </div>
      )}
    </div>
  )
}

function QuickAnalyzer() {
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const analyze = async () => {
    if (!text.trim() || text.length < 20) return
    setLoading(true)
    try {
      const res = await analyzeQuickSample(text)
      setResult(res)
    } catch (err) {
      setResult({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const colorMap = { red: 'text-red-600', yellow: 'text-amber-600', green: 'text-emerald-600' }

  return (
    <div className="card">
      <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <Brain size={16} className="text-brand-500" />
        Quick Sentence Analyzer
      </h3>
      <textarea
        value={text}
        onChange={e => { setText(e.target.value); setResult(null) }}
        placeholder="Paste any sentence here to check if it sounds AI-generated..."
        className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none h-24
          focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
      />
      <button
        onClick={analyze}
        disabled={loading || text.length < 20}
        className="btn-primary mt-2 text-sm"
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
        Analyze
      </button>

      {result && !result.error && (
        <div className={`mt-4 p-4 rounded-xl border ${
          result.risk_level === 'red' ? 'bg-red-50 border-red-200' :
          result.risk_level === 'yellow' ? 'bg-amber-50 border-amber-200' :
          'bg-emerald-50 border-emerald-200'
        }`}>
          <div className={`font-bold text-lg ${colorMap[result.risk_level]}`}>
            {result.score.toFixed(1)}% AI Probability
          </div>
          {result.reasons?.map((r, i) => (
            <div key={i} className="text-xs text-slate-600 mt-1">• {r}</div>
          ))}
          {result.ai_words_found?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.ai_words_found.map(w => (
                <span key={w} className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">{w}</span>
              ))}
            </div>
          )}
        </div>
      )}
      {result?.error && (
        <div className="mt-3 text-red-500 text-sm">{result.error}</div>
      )}
    </div>
  )
}

export default function TrainingMode() {
  const [examples, setExamples] = useState([])
  const [loading, setLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(0)
  const [tab, setTab] = useState('practice') // practice | quick

  useEffect(() => {
    getTrainingExamples()
      .then(data => setExamples(data.examples || []))
      .catch(() => setExamples([]))
      .finally(() => setLoading(false))
  }, [])

  const handleAnswer = (delta) => {
    setScore(s => s + delta)
    setAnswered(a => a + 1)
  }

  const reset = () => {
    setScore(0)
    setAnswered(0)
    window.location.reload()
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-brand-500" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Score banner */}
      <div className="card bg-gradient-to-r from-brand-500 to-purple-600 text-white border-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm opacity-80 mb-1">Your Score</div>
            <div className="text-4xl font-bold">{score}</div>
            <div className="text-sm opacity-70 mt-1">{answered} of {examples.length} answered</div>
          </div>
          <div className="text-right">
            <Trophy size={40} className="opacity-80 mb-2" />
            {answered > 0 && (
              <button onClick={reset} className="text-xs opacity-80 hover:opacity-100 flex items-center gap-1">
                <RotateCcw size={11} /> Reset
              </button>
            )}
          </div>
        </div>
        {answered > 0 && (
          <div className="mt-4 bg-white/20 rounded-full h-2">
            <div
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${(answered / examples.length) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
        {[{ k: 'practice', label: '📚 Practice Examples' }, { k: 'quick', label: '⚡ Quick Analyzer' }].map(({ k, label }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              tab === k ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'practice' && (
        <div className="space-y-4">
          {examples.map(ex => (
            <ExampleCard key={ex.id} example={ex} onAnswer={handleAnswer} />
          ))}
          {examples.length === 0 && (
            <p className="text-center text-slate-400 py-12">
              Could not load training examples. Make sure the backend is running.
            </p>
          )}
        </div>
      )}

      {tab === 'quick' && <QuickAnalyzer />}
    </div>
  )
}
