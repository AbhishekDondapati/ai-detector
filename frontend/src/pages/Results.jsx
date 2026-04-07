import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Download, RefreshCw, Loader2, AlertCircle, FileText, BarChart2, ScanText } from 'lucide-react'
import ScoreCard from '../components/ScoreCard'
import TextHighlighter from '../components/TextHighlighter'
import SectionBreakdown from '../components/SectionBreakdown'
import { getResults, exportPdfReport, analyzeDocument } from '../services/api'

const TABS = [
  { key: 'overview', label: 'Overview', icon: BarChart2 },
  { key: 'document', label: 'Highlighted Document', icon: ScanText },
  { key: 'sections', label: 'Section Analysis', icon: FileText },
]

export default function Results() {
  const { docId } = useParams()
  const [analysis, setAnalysis] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('overview')
  const [exporting, setExporting] = useState(false)
  const [sensitivity, setSensitivity] = useState(0.5)
  const [reanalyzing, setReanalyzing] = useState(false)

  useEffect(() => {
    if (!docId) return
    getResults(docId)
      .then(data => { setAnalysis(data); setSensitivity(data._sensitivity ?? 0.5) })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [docId])

  const handleReanalyze = async () => {
    setReanalyzing(true)
    setError('')
    try {
      const data = await analyzeDocument(docId, { sensitivity })
      setAnalysis(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setReanalyzing(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportPdfReport(docId)
    } catch (err) {
      setError(`Export failed: ${err.message}`)
    } finally {
      setExporting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative mx-auto w-16 h-16">
          <div className="w-16 h-16 border-4 border-slate-100 rounded-full" />
          <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-600 font-medium">Loading analysis results...</p>
      </div>
    </div>
  )

  if (error && !analysis) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card max-w-md text-center">
        <AlertCircle size={40} className="mx-auto text-red-400 mb-3" />
        <h2 className="font-bold text-slate-800 mb-2">Could not load results</h2>
        <p className="text-slate-500 text-sm mb-4">{error}</p>
        <Link to="/" className="btn-primary">
          <ArrowLeft size={15} /> Upload a document
        </Link>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Link to="/" className="btn-ghost">
            <ArrowLeft size={16} /> Back
          </Link>
          <div>
            <h1 className="font-bold text-xl text-slate-800">{analysis?.filename}</h1>
            <p className="text-sm text-slate-500">
              {analysis?.word_count?.toLocaleString()} words · {analysis?.total_sentences} sentences ·
              Analyzed in {analysis?.processing_time_ms?.toFixed(0)}ms
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Re-analyze with sensitivity */}
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <span className="text-xs text-slate-500 whitespace-nowrap">Sensitivity:</span>
            <input
              type="range" min="0" max="1" step="0.05"
              value={sensitivity}
              onChange={e => setSensitivity(parseFloat(e.target.value))}
              className="w-20 accent-brand-500"
            />
            <span className="text-xs font-medium text-slate-700 w-8">{(sensitivity * 100).toFixed(0)}%</span>
          </div>
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="btn-secondary text-sm"
          >
            {reanalyzing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Re-analyze
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="btn-primary text-sm"
          >
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export PDF
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-6 text-sm text-red-600 flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === key ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <div className="max-w-2xl">
          <ScoreCard analysis={analysis} />
        </div>
      )}

      {tab === 'document' && (
        <div>
          <TextHighlighter sentences={analysis?.sentences || []} />
        </div>
      )}

      {tab === 'sections' && (
        <SectionBreakdown
          sections={analysis?.sections}
          topWords={analysis?.top_ai_words}
          topPhrases={analysis?.top_phrases}
        />
      )}
    </div>
  )
}
