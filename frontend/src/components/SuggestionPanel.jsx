import React, { useState } from 'react'
import { Wand2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'

export default function SuggestionPanel({ topWords, topPhrases }) {
  const [expanded, setExpanded] = useState(true)
  const [copied, setCopied] = useState(null)

  const copy = (text, id) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const wordReplacements = {
    'delve': 'examine, explore, investigate',
    'pivotal': 'key, central, critical',
    'multifaceted': 'complex, varied, multiple',
    'leverage': 'use, apply, employ',
    'underscore': 'highlight, emphasize, stress',
    'nuanced': 'detailed, subtle, layered',
    'transformative': 'significant, impactful, major',
    'groundbreaking': 'novel, landmark, significant',
    'seamlessly': 'smoothly, easily, effectively',
    'robust': 'strong, reliable, solid',
    'holistic': 'overall, comprehensive, complete',
    'harness': 'use, apply, channel',
    'empower': 'enable, allow, help',
    'foster': 'support, encourage, promote',
    'streamline': 'simplify, improve, optimize',
    'elucidate': 'explain, clarify, describe',
    'facilitate': 'help, enable, support',
    'paradigm': 'model, approach, framework',
    'meticulous': 'careful, thorough, detailed',
    'invaluable': 'valuable, essential, critical',
    'tapestry': 'mix, combination, blend',
    'vibrant': 'active, dynamic, lively',
    'realm': 'area, field, domain',
    'cornerstone': 'foundation, basis, core',
    'synergy': 'combination, cooperation, interaction',
  }

  return (
    <div className="card space-y-5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Wand2 size={18} className="text-brand-500" />
          <h3 className="font-semibold text-slate-700">Writing Improvement Tips</h3>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="space-y-5 animate-fade-in">
          {/* Top AI words with replacements */}
          {topWords?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-600 mb-3">
                Replace These AI Words
              </h4>
              <div className="space-y-2">
                {topWords.slice(0, 6).map(({ word, count }) => (
                  <div key={word} className="flex items-start gap-3 p-3 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-red-700 text-sm">"{word}"</span>
                        <span className="text-xs text-red-400">({count}x)</span>
                      </div>
                      {wordReplacements[word] && (
                        <p className="text-xs text-slate-600">
                          Try instead: <span className="text-emerald-700 font-medium">{wordReplacements[word]}</span>
                        </p>
                      )}
                    </div>
                    {wordReplacements[word] && (
                      <button
                        onClick={() => copy(wordReplacements[word], word)}
                        className="text-slate-400 hover:text-brand-500 transition-colors mt-0.5"
                        title="Copy alternatives"
                      >
                        {copied === word ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* General tips */}
          <div>
            <h4 className="text-sm font-semibold text-slate-600 mb-3">General Tips</h4>
            <div className="space-y-2">
              {[
                { tip: 'Add specific numbers, dates, or measurements instead of vague claims', icon: '📊' },
                { tip: 'Use first-person voice where appropriate (I found, We observed)', icon: '✍️' },
                { tip: 'Vary sentence length — mix short punchy sentences with longer ones', icon: '📏' },
                { tip: 'Remove filler openers like "It is important to note that..."', icon: '✂️' },
                { tip: 'Replace "a myriad of" / "a plethora of" with exact quantities', icon: '🔢' },
                { tip: 'Add domain-specific jargon that reflects genuine expertise', icon: '🔬' },
              ].map(({ tip, icon }, i) => (
                <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl text-sm text-slate-600">
                  <span>{icon}</span>
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
