/**
 * API service — all backend calls go through here.
 * Base URL is proxied by Vite in dev; set VITE_API_URL for production.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120_000, // 2 min for large documents
})

// Request interceptor — add auth token if present
api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — normalize errors
api.interceptors.response.use(
  res => res,
  err => {
    const msg = err.response?.data?.detail || err.message || 'Unknown error'
    return Promise.reject(new Error(msg))
  }
)

// ─── Upload ───────────────────────────────────────────
export const uploadDocument = async (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post('/upload/', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
  return res.data
}

// ─── Analysis ─────────────────────────────────────────
export const analyzeDocument = async (docId, { sensitivity = 0.5, includeRewrites = false } = {}) => {
  const res = await api.post(`/analyze/${docId}`, null, {
    params: { sensitivity, include_rewrites: includeRewrites }
  })
  return res.data
}

export const getResults = async (docId) => {
  const res = await api.get(`/analyze/${docId}/results`)
  return res.data
}

export const rewriteSentence = async (sentence, context = null, style = 'academic') => {
  const res = await api.post('/analyze/rewrite', { sentence, context, style })
  return res.data
}

export const rewriteSpecificSentence = async (docId, sentenceId) => {
  const res = await api.get(`/analyze/${docId}/sentence/${sentenceId}/rewrite`)
  return res.data
}

export const exportPdfReport = async (docId) => {
  const res = await api.post(`/analyze/${docId}/export-pdf`, null, {
    responseType: 'blob'
  })
  // Trigger browser download
  const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `ai_report_${docId.slice(0, 8)}.pdf`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

// ─── Training ─────────────────────────────────────────
export const getTrainingExamples = async () => {
  const res = await api.get('/training/examples')
  return res.data
}

export const submitTrainingAnswer = async (exampleId, userAnswer) => {
  const res = await api.post('/training/answer', {
    example_id: exampleId,
    user_answer: userAnswer
  })
  return res.data
}

export const analyzeQuickSample = async (text) => {
  const res = await api.post('/training/analyze-sample', { text })
  return res.data
}

// ─── Health ───────────────────────────────────────────
export const checkHealth = async () => {
  const res = await api.get('/health')
  return res.data
}
