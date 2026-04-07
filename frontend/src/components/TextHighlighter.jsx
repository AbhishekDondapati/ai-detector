import React, { useState, useRef } from 'react'
import { Tooltip } from 'react-tooltip'
import { Wand2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { rewriteSentence } from '../services/api'

const RISK_COLORS = {
  red:    { bg: 'bg-red-100',    border: 'border-red-400',    text: 'text-red-900',    badge: 'bg-red-500' },
  yellow: { bg: 'bg-amber-100',  border: 'border-amber-400',  text: 'text-amber-900',  badge: 'bg-amber-400' },
  green:  { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900', badge: 'bg-emerald-500' },
}

function SentenceToken({ sentence, showAll }) {
  const [expanded, setExpanded] = useState(false)
  const [rewrite, setRewrite] = useState(null)
  const [loadingRewrite, setLoadingRewrite] = useState(false)
  const tooltipId = `tip-${sentence.id}`

  if (!showAll && sentence.risk_level === 'green') {
    return <span className="text-slate-700">{sentence.text} </span>
  }

  const c = RISK_COLORS[sentence.risk_level]

  const handleRewrite = async (e) => {
    e.stopPropagation()
    if (rewrite) { setRewrite(null); return }
    setLoadingRewrite(true)
    try {
      const result = await rewriteSentence(sentence.text)
      setRewrite(result)
    } catch {
      setRewrite({ suggestion: 'Could not generate suggestion.', explanation: 'API unavailable.' })
    } finally {
      setLoadingRewrite(false)
    }
  }

  return (
    <span className="inline">
      <span
        data-tooltip-id={tooltipId}
        onClick={() => setExpanded(!expanded)}
        className={`sentence-token ${sentence.risk_level} ${c.bg} ${c.text} cursor-pointer
          inline rounded px-0.5 border-b-2 ${c.border}`}
      >
        {sentence.text}
      </span>
      {' '}

      {/* Tooltip with reasons */}
      <Tooltip id={tooltipId} place="top" className="max-w-xs z-50" style={{ background: '#1E293B', borderRadius: '12px' }}>
        <div className="p-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${c.badge}`} />
            <span className="font-semibold text-white capitalize">
              {sentence.risk_level === 'red' ? 'High AI Risk' : sentence.risk_level === 'yellow' ? 'Suspicious' : 'Human-like'}
            </span>
            <span className="ml-auto text-slate-300 text-xs">{sentence.score.toFixed(0)}%</span>
          </div>
          {sentence.reasons?.map((r, i) => (
            <div key={i} className="text-slate-300 text-xs flex gap-1">
              <span className="text-slate-500">•</span> {r}
            </div>
          ))}
          {sentence.ai_words_found?.length > 0 && (
            <div className="text-amber-300 text-xs">
              AI words: {sentence.ai_words_found.slice(0, 4).join(', ')}
            </div>
          )}
        </div>
      </Tooltip>

      {/* Expanded panel */}
      {expanded && sentence.risk_level !== 'green' && (
        <span className="block mt-1 mb-2 ml-2">
          <span className={`inline-block w-full rounded-xl border ${c.border} ${c.bg} p-3 text-sm`}>
            {/* Reasons */}
            <span className="block font-medium text-slate-700 mb-1.5">Why flagged:</span>
            {sentence.reasons?.map((r, i) => (
              <span key={i} className="block text-slate-600 text-xs mb-0.5">• {r}</span>
            ))}

            {/* AI words found */}
            {sentence.ai_words_found?.length > 0 && (
              <span className="block mt-2">
                <span className="text-xs font-medium text-slate-500">AI words: </span>
                {sentence.ai_words_found.map(w => (
                  <span key={w} className="inline-block bg-red-200 text-red-800 text-xs px-1.5 py-0.5 rounded mr-1 mb-1">
                    {w}
                  </span>
                ))}
              </span>
            )}

            {/* Rewrite button */}
            <span className="block mt-3">
              <button
                onClick={handleRewrite}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600
                  hover:text-brand-700 bg-white border border-brand-200 hover:border-brand-400
                  px-3 py-1.5 rounded-lg transition-colors"
              >
                {loadingRewrite ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                {rewrite ? 'Hide suggestion' : 'Get rewrite suggestion'}
              </button>
            </span>

            {/* Rewrite result */}
            {rewrite && (
              <span className="block mt-3 bg-white rounded-lg border border-brand-200 p-3">
                <span className="block text-xs font-semibold text-brand-600 mb-1">Suggested rewrite:</span>
                <span className="block text-sm text-slate-700 italic">"{rewrite.suggestion}"</span>
                <span className="block text-xs text-slate-500 mt-1.5">{rewrite.explanation}</span>
              </span>
            )}
          </span>
        </span>
      )}
    </span>
  )
}

export default function TextHighlighter({ sentences }) {
  const [showAll, setShowAll] = useState(true)
  const [filter, setFilter] = useState('all') // all | red | yellow | green

  if (!sentences?.length) return null

  const filtered = filter === 'all' ? sentences : sentences.filter(s => s.risk_level === filter)

  const redCount = sentences.filter(s => s.risk_level === 'red').length
  const yellowCount = sentences.filter(s => s.risk_level === 'yellow').length
  const greenCount = sentences.filter(s => s.risk_level === 'green').length

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-slate-600">Filter:</span>
        {[
          { key: 'all', label: `All (${sentences.length})`, cls: 'bg-slate-100 text-slate-700 hover:bg-slate-200' },
          { key: 'red', label: `High Risk (${redCount})`, cls: 'bg-red-100 text-red-700 hover:bg-red-200' },
          { key: 'yellow', label: `Suspicious (${yellowCount})`, cls: 'bg-amber-100 text-amber-700 hover:bg-amber-200' },
          { key: 'green', label: `Human-like (${greenCount})`, cls: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' },
        ].map(({ key, label, cls }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${cls}
              ${filter === key ? 'ring-2 ring-offset-1 ring-current' : ''}`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
          <span>Click sentence to expand</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        {[
          { color: 'bg-red-400', label: 'High AI Risk (≥65%)' },
          { color: 'bg-amber-400', label: 'Suspicious (30-64%)' },
          { color: 'bg-emerald-400', label: 'Human-like (<30%)' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-1.5 rounded-sm ${color}`} />
            {label}
          </span>
        ))}
      </div>

      {/* Document text */}
      <div className="card leading-8 text-base">
        {filter === 'all'
          ? sentences.map(s => (
              <SentenceToken key={s.id} sentence={s} showAll={showAll} />
            ))
          : (
            <div className="space-y-2">
              {filtered.map(s => (
                <div key={s.id} className="block">
                  <SentenceToken sentence={s} showAll={true} />
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-slate-400 text-center py-8">No sentences match this filter.</p>
              )}
            </div>
          )
        }
      </div>
    </div>
  )
}
