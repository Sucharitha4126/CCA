import { useState } from 'react'
import toast from 'react-hot-toast'
import { Send, Sparkles } from 'lucide-react'
import { api } from '../api/client.js'
import RiskBadge from './RiskBadge.jsx'

export default function SendMoneyForm({ onCreated }) {
  const [receiverEmail, setReceiverEmail] = useState('arjun@sentinelpay.io')
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('SP-100246')
  const [amount, setAmount] = useState('1200')
  const [loading, setLoading] = useState(false)
  const [evaluation, setEvaluation] = useState(null)

  const payload = {
    receiver_email: receiverEmail.trim(),
    receiver_account_number: receiverAccountNumber.trim(),
    amount: Number(amount),
  }

  async function evaluate() {
    setLoading(true)
    try {
      const { data } = await api.post('/api/transactions/evaluate', payload)
      setEvaluation(data)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Evaluation failed')
    } finally {
      setLoading(false)
    }
  }

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const { data } = await api.post('/api/transactions', payload)
      toast.success(data.status === 'blocked' ? 'High-risk transfer blocked for review' : 'Transaction completed')
      setEvaluation({ score: data.fraud_score, risk_level: data.risk_level, recommendation: data.ai_summary, reasons: [data.ai_summary] })
      onCreated?.(data)
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Transaction failed')
    } finally {
      setLoading(false)
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
        <input className="input" value={receiverAccountNumber} onChange={(event) => setReceiverAccountNumber(event.target.value)} placeholder="Receiver account number" />
        <input className="input" value={amount} onChange={(event) => setAmount(event.target.value)} type="number" min="1" placeholder="Amount" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" className="btn-secondary" disabled={loading} onClick={evaluate}><Sparkles size={16} /> AI Evaluate</button>
          <button className="btn-primary" disabled={loading}><Send size={16} /> Send</button>
        </div>
      </div>
      {evaluation && (
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold">AI Evaluation</p>
            <RiskBadge level={evaluation.risk_level} />
          </div>
          <p className="mt-3 text-sm text-slate-300">Score: <span className="font-semibold text-white">{evaluation.score}</span></p>
          <p className="mt-2 text-sm text-slate-400">{evaluation.recommendation}</p>
          <p className="mt-2 text-xs text-slate-500">High-risk transfers are blocked before money moves.</p>
        </div>
      )}
    </form>
  )
}
