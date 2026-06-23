import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { AlertOctagon, Ban, Banknote, Landmark, RadioTower, ShieldCheck, Snowflake, TrendingUp, Users } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, BarChart, Bar } from 'recharts'
import Layout from '../components/Layout.jsx'
import StatCard from '../components/StatCard.jsx'
import RiskBadge from '../components/RiskBadge.jsx'
import TransactionTable from '../components/TransactionTable.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { api, WS_URL } from '../api/client.js'
import { currency, shortDate } from '../utils/format.js'

const colors = ['#34d399', '#fbbf24', '#fb7185']

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null)
  const [users, setUsers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [alerts, setAlerts] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const [analyticsRes, usersRes, txRes, alertsRes, logsRes] = await Promise.all([
      api.get('/api/admin/analytics'),
      api.get('/api/admin/users'),
      api.get('/api/transactions'),
      api.get('/api/admin/alerts'),
      api.get('/api/admin/activity-logs'),
    ])
    setAnalytics(analyticsRes.data)
    setUsers(usersRes.data)
    setTransactions(txRes.data)
    setAlerts(alertsRes.data)
    setLogs(logsRes.data)
    setLoading(false)
  }

  useEffect(() => { load().catch(() => setLoading(false)) }, [])
  useEffect(() => {
    const socket = new WebSocket(WS_URL)
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data)
      if (message.type === 'transaction.created') setTransactions((items) => [message.payload, ...items])
    }
    return () => socket.close()
  }, [])

  const pieData = useMemo(() => analytics ? Object.entries(analytics.risk_distribution).map(([name, value]) => ({ name, value })) : [], [analytics])

  async function freeze(user) {
    try {
      const { data } = await api.patch(`/api/admin/users/${user.id}/freeze`, { is_frozen: !user.is_frozen })
      setUsers((items) => items.map((item) => item.id === data.id ? data : item))
      toast.success(data.is_frozen ? 'Account frozen' : 'Account unfrozen')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Action failed')
    }
  }

  function exportCsv() {
    const csv = transactions.map((tx) => [tx.id, tx.sender_name, tx.receiver_name, tx.amount, tx.status, tx.risk_level, tx.fraud_score].join(',')).join('\n')
    const blob = new Blob([`id,sender,receiver,amount,status,risk,score\n${csv}`], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'admin-transactions.csv'
    link.click()
  }

  if (loading) return <Layout><div className="grid gap-4 md:grid-cols-4"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div></Layout>

  return (
    <Layout>
      <div className="mb-7">
        <p className="text-sm text-cyan-200">Admin command center</p>
        <h1 className="text-3xl font-bold">Fraud Operations Dashboard</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={RadioTower} label="Total Transactions" value={analytics?.total_transactions} detail="Live monitored payments" />
        <StatCard icon={AlertOctagon} label="Fraud Detections" value={analytics?.fraud_count} tone="violet" detail="Medium and high risk" />
        <StatCard icon={Users} label="Suspicious Accounts" value={analytics?.suspicious_accounts} detail="Flagged or frozen users" />
        <StatCard icon={Banknote} label="Volume" value={currency(analytics?.volume)} detail={`Average risk ${analytics?.average_risk}`} />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Landmark} label="User Balances" value={currency(analytics?.total_customer_balance)} detail="Total simulated deposits" />
        <StatCard icon={TrendingUp} label="High-Value Accounts" value={analytics?.high_value_accounts} detail="Balances above monitoring threshold" />
        <StatCard icon={Snowflake} label="Frozen Accounts" value={analytics?.frozen_accounts} detail="Compliance locked profiles" />
        <StatCard icon={AlertOctagon} label="Suspicious Balance Changes" value={analytics?.suspicious_balance_changes} detail="High-risk or draining transfers" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-bold">Fraud Heatmap</h3>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={72} outerRadius={108} paddingAngle={5}>
                  {pieData.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-bold">Activity Logs</h3>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={logs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" tickFormatter={(value) => currency(value)} />
                <Tooltip formatter={(value, name) => name === 'volume' ? currency(value) : value} contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="transactions" fill="#22d3ee" radius={[5, 5, 0, 0]} />
                <Bar dataKey="volume" fill="#a78bfa" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <TransactionTable transactions={transactions} onExport={exportCsv} />
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-bold">User Management</h3>
          <div className="mt-4 space-y-3">
            {users.filter((item) => item.role !== 'admin').map((item) => (
              <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{item.full_name || item.name}</p>
                    <p className="text-xs text-slate-500">{item.email}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.bank_name || 'Bank pending'} / {item.account_number || 'No account number'}</p>
                    <p className="mt-1 text-sm font-semibold text-cyan-100">{currency(item.balance)}</p>
                  </div>
                  <RiskBadge level={item.risk_score >= 70 ? 'HIGH RISK' : item.risk_score >= 40 ? 'MEDIUM RISK' : 'LOW RISK'} />
                </div>
                <button onClick={() => freeze(item)} className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900">
                  {item.is_frozen ? <ShieldCheck size={16} /> : <Ban size={16} />} {item.is_frozen ? 'Unfreeze' : 'Freeze'} account
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 glass rounded-lg p-5">
        <h3 className="text-lg font-bold">Admin Alerts</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {alerts.slice(0, 6).map((alert) => (
            <div key={alert.id} className="rounded-lg border border-rose-400/20 bg-rose-500/10 p-4">
              <p className="text-sm font-semibold text-rose-100">{alert.alert_type}</p>
              <p className="mt-2 text-sm text-slate-300">{alert.message}</p>
              <p className="mt-3 text-xs text-slate-500">{shortDate(alert.created_at)}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
