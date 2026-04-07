import React, { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

/** Animated circular progress ring */
function RingMeter({ value, size = 120, strokeWidth = 10, color }) {
  const [animated, setAnimated] = useState(0)
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animated / 100) * circumference

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 100)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Background ring */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke="#F1F5F9" strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="score-ring"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)' }}
      />
      {/* Center text */}
      <text
        x={size / 2} y={size / 2 + 6}
        textAnchor="middle" fontSize="20" fontWeight="700" fill={color}
        fontFamily="Inter, sans-serif"
      >
        {Math.round(animated)}%
      </text>
    </svg>
  )
}

/** Single metric card */
function MetricCard({ label, value, unit = '', description, color = '#6366F1', icon }) {
  return (
    <div className="card-sm text-center">
      {icon && <div className="text-2xl mb-1">{icon}</div>}
      <div className="text-2xl font-bold" style={{ color }}>
        {typeof value === 'number' ? value.toFixed(value > 10 ? 1 : 3) : value}
        <span className="text-base font-normal text-slate-400 ml-1">{unit}</span>
      </div>
      <div className="text-sm font-medium text-slate-600 mt-0.5">{label}</div>
      {description && <div className="text-xs text-slate-400 mt-1">{description}</div>}
    </div>
  )
}

export default function ScoreCard({ analysis }) {
  if (!analysis) return null

  const { ai_probability, humanization_score, burstiness_score, lexical_diversity,
    avg_sentence_length, readability_score, total_sentences,
    red_count, yellow_count, green_count } = analysis

  const aiColor = ai_probability >= 65 ? '#EF4444' : ai_probability >= 35 ? '#F59E0B' : '#10B981'
  const humanColor = humanization_score >= 65 ? '#10B981' : humanization_score >= 35 ? '#F59E0B' : '#EF4444'

  const verdict = ai_probability >= 65
    ? { label: 'High AI Content', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: '🤖' }
    : ai_probability >= 35
    ? { label: 'Mixed Content', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠️' }
    : { label: 'Likely Human', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '✍️' }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Verdict Banner */}
      <div className={`flex items-center gap-3 p-4 rounded-2xl border ${verdict.bg} ${verdict.border}`}>
        <span className="text-3xl">{verdict.icon}</span>
        <div>
          <div className={`font-bold text-lg ${verdict.color}`}>{verdict.label}</div>
          <div className="text-sm text-slate-600">
            This document shows <strong>{ai_probability.toFixed(1)}%</strong> AI probability
            across {total_sentences} sentences
          </div>
        </div>
      </div>

      {/* Main Score Rings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <RingMeter value={ai_probability} color={aiColor} />
          <div className="mt-3 font-semibold text-slate-700">AI Probability</div>
          <div className="text-xs text-slate-400 mt-1">Higher = more AI-like</div>
        </div>
        <div className="card text-center">
          <RingMeter value={humanization_score} color={humanColor} />
          <div className="mt-3 font-semibold text-slate-700">Humanization Score</div>
          <div className="text-xs text-slate-400 mt-1">Higher = more natural</div>
        </div>
      </div>

      {/* Sentence Distribution */}
      <div className="card">
        <h3 className="font-semibold text-slate-700 mb-4">Sentence Distribution</h3>
        <div className="space-y-3">
          {[
            { label: 'High AI Risk', count: red_count, color: '#EF4444', bg: 'bg-red-500' },
            { label: 'Suspicious', count: yellow_count, color: '#F59E0B', bg: 'bg-amber-400' },
            { label: 'Human-like', count: green_count, color: '#10B981', bg: 'bg-emerald-500' },
          ].map(({ label, count, color, bg }) => {
            const pct = total_sentences > 0 ? (count / total_sentences) * 100 : 0
            return (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-slate-600">{label}</span>
                  <span className="font-semibold" style={{ color }}>{count} ({pct.toFixed(0)}%)</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full progress-bar ${bg}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Technical Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Burstiness"
          value={burstiness_score}
          description={burstiness_score > 0 ? '↑ Varied (human-like)' : '↓ Uniform (AI-like)'}
          color={burstiness_score > 0 ? '#10B981' : '#EF4444'}
          icon="📊"
        />
        <MetricCard
          label="Lexical Diversity"
          value={lexical_diversity}
          description={lexical_diversity > 0.6 ? 'Rich vocabulary' : 'Repetitive'}
          color={lexical_diversity > 0.6 ? '#10B981' : '#F59E0B'}
          icon="📝"
        />
        <MetricCard
          label="Avg Sentence"
          value={avg_sentence_length}
          unit="words"
          description="AI avg: 22-35 words"
          color="#6366F1"
          icon="📏"
        />
        <MetricCard
          label="Readability"
          value={readability_score}
          description={readability_score >= 60 ? 'Easy to read' : readability_score >= 30 ? 'Moderate' : 'Complex'}
          color="#6366F1"
          icon="📖"
        />
      </div>
    </div>
  )
}
