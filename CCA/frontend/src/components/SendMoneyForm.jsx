import { useState } from 'react'
import toast from 'react-hot-toast'
import { Send, Sparkles } from 'lucide-react'
import { api } from '../api/client.js'
import RiskBadge from './RiskBadge.jsx'

export default function SendMoneyForm({ onCreated }) {
  const [receiverEmail, setReceiverEmail] = useState('arjun@sentinelpay.io')
  const [amount, setAmount] = useState('1200')
  const [sending, setSending] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [error, setError] = useState('')

  const loading = sending || evaluating

  function buildPayload() {
    const parsedAmount = Number(amount)
    if (!receiverEmail.trim()) {
      throw new Error('Enter a receiver email before evaluating')
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      throw new Error('Enter a valid amount before evaluating')
    }
    return { receiver_email: receiverEmail.trim(), amount: parsedAmount }
  }

  function normalizeEvaluation(data) {
    return {
      score: data.score ?? data.fraud_score ?? 0,
      risk_level: data.risk_level || 'LOW RISK',
      recommendation: data.recommendation || data.ai_summary || 'Evaluation completed.',
      reasons: Array.isArray(data.reasons) && data.reasons.length ? data.reasons : [data.recommendation || data.ai_summary || 'No major suspicious pattern detected.'],
    }
  }

  async function evaluate() {
    setError('')
    setEvaluating(true)
    try {
      const payload = buildPayload()
      const { data } = await api.post('/api/transactions/evaluate', payload)
      setEvaluation(normalizeEvaluation(data))
      toast.success('AI evaluation complete')
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Evaluation failed'
      setError(message)
      toast.error(message)
    } finally {
      setEvaluating(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSending(true)
    try {
      const payload = buildPayload()
      const { data } = await api.post('/api/transactions', payload)
      toast.success(data.status === 'blocked' ? 'High-risk transfer blocked for review' : 'Transaction completed')
      setEvaluation(normalizeEvaluation(data))
      onCreated?.(data)
    } catch (error) {
      const message = error.response?.data?.detail || error.message || 'Transaction failed'
      setError(message)
      toast.error(message)
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="glass rounded-lg p-5">
      <div className="mb-5">
        <h3 className="text-lg font-bold">Send Money</h3>
        <p className="text-sm text-slate-400">Balance, account status, AI risk, and digital signature are validated before settlement.</p>
      </div>
      <div className="space-y-4">
        <input className="input" value={receiverEmail} onChange={(event) => setReceiverEmail(event.target.value)} placeholder="Receiver email" />
        <input className="input" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" placeholder="Amount" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" className="btn-secondary" disabled={loading} onClick={evaluate}><Sparkles size={16} /> {evaluating ? 'Evaluating...' : 'AI Evaluate'}</button>
          <button className="btn-primary" disabled={loading}><Send size={16} /> {sending ? 'Sending...' : 'Send'}</button>
        </div>
      </div>
      {error && (
        <div className="mt-4 rounded-md border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      )}
      {evaluation && (
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">AI Evaluation</p>
            <RiskBadge level={evaluation.risk_level} />
          </div>
          <p className="mt-3 text-sm text-slate-300">Score: <span className="font-semibold text-white">{evaluation.score}</span></p>
          <p className="mt-2 text-sm text-slate-400">{evaluation.recommendation}</p>
          <ul className="mt-3 space-y-1 text-sm text-slate-400">
            {evaluation.reasons.map((reason) => (
              <li key={reason}>- {reason}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-500">High-risk transfers are blocked before money moves.</p>
        </div>
      )}
    </form>
  )
}
