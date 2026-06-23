import { useEffect, useMemo, useState } from 'react'
import { Activity, AlertTriangle, ArrowDownLeft, ArrowUpRight, CircleDollarSign, Landmark, ShieldAlert } from 'lucide-react'
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Layout from '../components/Layout.jsx'
import SendMoneyForm from '../components/SendMoneyForm.jsx'
import StatCard from '../components/StatCard.jsx'
import TransactionTable from '../components/TransactionTable.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { api, WS_URL } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { currency, shortDate } from '../utils/format.js'

export default function UserDashboard() {
  const { user, setUser } = useAuth()
  const [transactions, setTransactions] = useState([])
  const [alerts, setAlerts] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState([])

  async function load() {
    const [txRes, alertRes, profileRes, balanceRes] = await Promise.all([
      api.get('/api/transactions'),
      api.get('/api/users/alerts'),
      api.get('/api/users/me'),
      api.get('/api/users/balance'),
    ])
    setTransactions(txRes.data)
    setAlerts(alertRes.data)
    setUser(profileRes.data)
    setBalance(balanceRes.data)
    setLoading(false)
  }

  useEffect(() => { load().catch(() => setLoading(false)) }, [])

  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'transaction.created') {
        setLive((items) => [message.payload, ...items].slice(0, 6))
        setTransactions((items) => [message.payload, ...items])
      }
    }
    return () => socket.close()
  }, [])

  const chartData = useMemo(() => transactions.slice(0, 10).reverse().map((tx, index) => ({
    name: `T${index + 1}`,
    amount: tx.amount,
    risk: tx.fraud_score,
  })), [transactions])

  function exportCsv() {
    const header = ['id', 'sender', 'receiver', 'amount', 'status', 'risk_level', 'fraud_score']
    const rows = transactions.map((tx) => [tx.id, tx.sender_name, tx.receiver_name, tx.amount, tx.status, tx.risk_level, tx.fraud_score])
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'sentinelpay-transactions.csv'
    link.click()
  }

  if (loading) {
    return <Layout><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div></Layout>
  }

  return (
    <Layout>
      <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-cyan-200">User dashboard</p>
          <h1 className="text-3xl font-bold">Welcome, {user?.full_name || user?.name}</h1>
          <p className="mt-2 text-sm text-slate-400">{user?.bank_name || 'SentinelPay Bank'} / {user?.account_number || 'Pending'} / {user?.account_type || 'Savings'}</p>
        </div>
        <RiskBadge level={user?.risk_score >= 70 ? 'HIGH RISK' : user?.risk_score >= 40 ? 'MEDIUM RISK' : 'LOW RISK'} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={CircleDollarSign} label="Current Account Balance" value={currency(balance?.balance ?? user?.balance)} detail="Amount stored on your simulated bank account" />
        <StatCard icon={Landmark} label="Available Balance" value={currency(balance?.available_balance ?? user?.balance)} detail={user?.is_frozen ? 'Account frozen by compliance' : 'Validated before every transfer'} />
        <StatCard icon={ArrowUpRight} label="Total Sent" value={currency(balance?.total_sent)} detail="Completed outgoing transfers" />
        <StatCard icon={ArrowDownLeft} label="Total Received" value={currency(balance?.total_received)} detail="Completed incoming transfers" />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <StatCard icon={ShieldAlert} label="Fraud Risk Score" value={`${Math.round(user?.risk_score || 0)}/100`} tone="violet" detail="Updated from AI and graph signals" />
        <StatCard icon={AlertTriangle} label="Security Status" value={user?.is_frozen ? 'Frozen' : 'Active'} detail={`${alerts.length} active alert${alerts.length === 1 ? '' : 's'}`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <SendMoneyForm onCreated={(tx) => { setTransactions((items) => [tx, ...items]); load().catch(() => {}) }} />
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-bold">Risk and Volume</h3>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="amount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.6}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => currency(value)} />
                <Tooltip formatter={(value, name) => name === 'amount' ? currency(value) : value} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Area dataKey="amount" stroke="#22d3ee" fill="url(#amount)" />
                <Bar dataKey="risk" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <TransactionTable transactions={transactions} onExport={exportCsv} />
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-bold">Real-Time Activity</h3>
          <div className="mt-4 space-y-3">
            {(live.length ? live : transactions.slice(0, 6)).map((tx) => (
              <div key={`${tx.id}-${tx.created_at}`} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Activity size={18} className="text-cyan-200" />
                    <p className="text-sm font-semibold">{currency(tx.amount)}</p>
                  </div>
                  <RiskBadge level={tx.risk_level} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{shortDate(tx.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
