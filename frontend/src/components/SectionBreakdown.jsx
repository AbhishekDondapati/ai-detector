import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Title, Tooltip, Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function getRiskColor(score) {
  if (score >= 65) return { bg: 'bg-red-100', text: 'text-red-700', bar: '#EF4444' }
  if (score >= 35) return { bg: 'bg-amber-100', text: 'text-amber-700', bar: '#F59E0B' }
  return { bg: 'bg-emerald-100', text: 'text-emerald-700', bar: '#10B981' }
}

export default function SectionBreakdown({ sections, topWords, topPhrases }) {
  if (!sections?.length && !topWords?.length) return null

  const sectionData = sections?.length > 0 ? {
    labels: sections.map(s => s.name),
    datasets: [
      {
        label: 'AI Score (%)',
        data: sections.map(s => s.ai_score),
        backgroundColor: sections.map(s => getRiskColor(s.ai_score).bar + 'CC'),
        borderColor: sections.map(s => getRiskColor(s.ai_score).bar),
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: 'Humanization Score (%)',
        data: sections.map(s => s.humanization_score),
        backgroundColor: '#6366F155',
        borderColor: '#6366F1',
        borderWidth: 1.5,
        borderRadius: 6,
      }
    ]
  } : null

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 }, usePointStyle: true } },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}%`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { callback: v => `${v}%` },
        grid: { color: '#F1F5F9' }
      },
      x: { grid: { display: false } }
    }
  }

  return (
    <div className="space-y-6">
      {/* Section Chart */}
      {sectionData && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Section-wise AI Analysis</h3>
          <Bar data={sectionData} options={chartOptions} />
        </div>
      )}

      {/* Section Table */}
      {sections?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Section Breakdown</h3>
          <div className="space-y-3">
            {sections.map((sec, i) => {
              const c = getRiskColor(sec.ai_score)
              return (
                <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50">
                  <div className="min-w-[120px]">
                    <div className="font-medium text-slate-700 text-sm">{sec.name}</div>
                    <div className="text-xs text-slate-400">{sec.sentence_count} sentences</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>AI Score</span>
                      <span className={`font-semibold ${c.text}`}>{sec.ai_score.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-2 rounded-full progress-bar"
                        style={{ width: `${sec.ai_score}%`, backgroundColor: c.bar }}
                      />
                    </div>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded-lg ${c.bg} ${c.text} min-w-fit`}>
                    {sec.flagged_count} flagged
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Top AI Words */}
      {topWords?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Most Frequent AI Words</h3>
          <div className="flex flex-wrap gap-2">
            {topWords.map(({ word, count }) => (
              <div
                key={word}
                className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5"
              >
                <span className="font-medium text-red-700 text-sm">{word}</span>
                <span className="text-xs text-red-400 bg-red-100 px-1.5 py-0.5 rounded-full">{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top AI Phrases */}
      {topPhrases?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-700 mb-4">Flagged Phrases</h3>
          <div className="space-y-2">
            {topPhrases.map(({ phrase, count }) => (
              <div key={phrase} className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
                <span className="text-sm text-amber-800 italic">"{phrase}"</span>
                <span className="text-xs text-amber-600 font-semibold ml-4">{count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
