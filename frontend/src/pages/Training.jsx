import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import TrainingMode from '../components/TrainingMode'

export default function Training() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="btn-ghost">
          <ArrowLeft size={16} /> Back
        </Link>
        <div>
          <h1 className="font-bold text-xl text-slate-800">Training Mode</h1>
          <p className="text-sm text-slate-500">
            Practice identifying AI-generated vs. human academic writing
          </p>
        </div>
      </div>

      <div className="card bg-gradient-to-r from-brand-50 to-purple-50 border-brand-100 mb-6">
        <h2 className="font-semibold text-slate-700 mb-2">How to Play</h2>
        <ul className="text-sm text-slate-600 space-y-1">
          <li>• Read each passage and decide: AI-generated or human-written?</li>
          <li>• Use hints if you're stuck — but it costs no points to look.</li>
          <li>• After answering, see the explanation and highlighted AI words.</li>
          <li>• Correct answers earn +10/+15/+20 points (Easy/Medium/Hard).</li>
          <li>• Wrong answers: -5 points. Try to build a streak!</li>
        </ul>
      </div>

      <TrainingMode />
    </div>
  )
}
