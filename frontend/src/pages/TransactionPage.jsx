import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import SendMoneyForm from '../components/SendMoneyForm.jsx'
import TransactionTable from '../components/TransactionTable.jsx'
import { api } from '../api/client.js'

export default function TransactionPage() {
  const [transactions, setTransactions] = useState([])
  const [query, setQuery] = useState('')
  const [risk, setRisk] = useState('ALL')

  useEffect(() => {
    api.get('/api/transactions').then(({ data }) => setTransactions(data)).catch(() => {})
  }, [])

  const filtered = useMemo(() => transactions.filter((tx) => {
    const haystack = `${tx.sender_name} ${tx.receiver_name} ${tx.status} ${tx.risk_level}`.toLowerCase()
    const matchesQuery = haystack.includes(query.toLowerCase())
    const matchesRisk = risk === 'ALL' || tx.risk_level === risk
    return matchesQuery && matchesRisk
  }), [transactions, query, risk])

  function exportCsv() {
    const csv = filtered.map((tx) => [tx.id, tx.sender_name, tx.receiver_name, tx.amount, tx.status, tx.risk_level, tx.fraud_score].join(',')).join('\n')
    const blob = new Blob([`id,sender,receiver,amount,status,risk,score\n${csv}`], { type: 'text/csv' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'filtered-transactions.csv'
    link.click()
  }

  return (
    <Layout>
      <div className="mb-7">
        <p className="text-sm text-cyan-200">Transaction center</p>
        <h1 className="text-3xl font-bold">Payments and AI Evaluation</h1>
      </div>
      <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]">
        <SendMoneyForm onCreated={(tx) => setTransactions((items) => [tx, ...items])} />
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-bold">AI Recommendation Panel</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            High-value transfers, burst activity, unusual velocity, balance-draining behavior, and account status are scored before settlement. High-risk transfers enter review status and create compliance alerts automatically.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {['LOW RISK', 'MEDIUM RISK', 'HIGH RISK'].map((item) => (
              <button key={item} onClick={() => setRisk(item)} className={`rounded-md border px-3 py-3 text-sm font-semibold ${risk === item ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-slate-800 text-slate-400'}`}>{item}</button>
            ))}
          </div>
          <button onClick={() => setRisk('ALL')} className="mt-3 text-sm text-slate-400 hover:text-white">Clear risk filter</button>
        </div>
      </div>
      <div className="my-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3.5 text-slate-500" size={18} />
          <input className="input pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions" />
        </div>
      </div>
      <TransactionTable transactions={filtered} onExport={exportCsv} />
    </Layout>
  )
}
