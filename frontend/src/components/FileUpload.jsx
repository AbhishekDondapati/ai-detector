import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate } from 'react-router-dom'
import { Upload, FileText, FileType, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { uploadDocument, analyzeDocument } from '../services/api'

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
}

export default function FileUpload() {
  const navigate = useNavigate()
  const [stage, setStage] = useState('idle') // idle | uploading | analyzing | done | error
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState('')
  const [sensitivity, setSensitivity] = useState(0.5)
  const [fileName, setFileName] = useState('')

  const processFile = useCallback(async (file) => {
    setError('')
    setFileName(file.name)

    // 1. Upload
    setStage('uploading')
    let uploadResult
    try {
      uploadResult = await uploadDocument(file, setUploadProgress)
    } catch (err) {
      setStage('error')
      setError(`Upload failed: ${err.message}`)
      return
    }

    // 2. Analyze
    setStage('analyzing')
    try {
      await analyzeDocument(uploadResult.document_id, { sensitivity })
    } catch (err) {
      setStage('error')
      setError(`Analysis failed: ${err.message}`)
      return
    }

    setStage('done')
    setTimeout(() => navigate(`/results/${uploadResult.document_id}`), 600)
  }, [navigate, sensitivity])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop: files => files[0] && processFile(files[0]),
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: stage !== 'idle',
  })

  const isLoading = stage === 'uploading' || stage === 'analyzing'

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200
          ${isDragActive && !isDragReject ? 'border-brand-500 bg-brand-50 dropzone-active' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${stage === 'idle' && !isDragActive ? 'border-slate-200 hover:border-brand-400 hover:bg-slate-50 bg-white' : ''}
          ${isLoading ? 'border-brand-300 bg-brand-50 cursor-not-allowed' : ''}
          ${stage === 'done' ? 'border-emerald-400 bg-emerald-50' : ''}
          ${stage === 'error' ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />

        {stage === 'idle' && (
          <>
            <div className="mx-auto w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mb-4">
              <Upload size={28} className="text-brand-500" />
            </div>
            <p className="text-slate-700 font-semibold text-lg mb-1">
              {isDragActive ? 'Drop to analyze' : 'Upload your document'}
            </p>
            <p className="text-slate-500 text-sm mb-4">
              Drag & drop a PDF or Word document, or click to browse
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <FileType size={13} /> PDF
              </span>
              <span className="flex items-center gap-1">
                <FileText size={13} /> DOCX
              </span>
              <span>Max 10MB</span>
            </div>
          </>
        )}

        {stage === 'uploading' && (
          <div className="space-y-4">
            <Loader2 size={36} className="mx-auto text-brand-500 animate-spin" />
            <p className="text-brand-700 font-medium">{fileName}</p>
            <div className="w-full bg-brand-100 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-brand-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-brand-600">Uploading... {uploadProgress}%</p>
          </div>
        )}

        {stage === 'analyzing' && (
          <div className="space-y-4">
            <div className="relative mx-auto w-16 h-16">
              <div className="w-16 h-16 border-4 border-brand-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-brand-700 font-semibold">Analyzing with AI Detection Engine</p>
            <p className="text-sm text-brand-500">
              Scanning for AI patterns, burstiness, lexical diversity...
            </p>
          </div>
        )}

        {stage === 'done' && (
          <div className="space-y-3">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
            <p className="text-emerald-700 font-semibold">Analysis complete! Redirecting...</p>
          </div>
        )}

        {stage === 'error' && (
          <div className="space-y-3">
            <AlertCircle size={40} className="mx-auto text-red-500" />
            <p className="text-red-700 font-semibold">Something went wrong</p>
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setStage('idle'); setError('') }}
              className="btn-secondary text-sm mt-2"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Sensitivity slider */}
      {stage === 'idle' && (
        <div className="card-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">
              Detection Sensitivity
            </label>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              sensitivity < 0.35 ? 'bg-emerald-100 text-emerald-700' :
              sensitivity < 0.65 ? 'bg-amber-100 text-amber-700' :
              'bg-red-100 text-red-700'
            }`}>
              {sensitivity < 0.35 ? 'Lenient' : sensitivity < 0.65 ? 'Balanced' : 'Strict'}
            </span>
          </div>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={sensitivity}
            onChange={e => setSensitivity(parseFloat(e.target.value))}
            className="w-full accent-brand-500"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Fewer false positives</span>
            <span>More thorough detection</span>
          </div>
        </div>
      )}
    </div>
  )
}
