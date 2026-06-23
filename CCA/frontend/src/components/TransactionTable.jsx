import { Download } from 'lucide-react'
import RiskBadge from './RiskBadge.jsx'
import { currency, shortDate } from '../utils/format.js'

export default function TransactionTable({ transactions = [], onExport }) {
  return (
    <div className="glass rounded-lg p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold">Transaction History</h3>
          <p className="text-sm text-slate-400">Filtered compliance-ready ledger</p>
        </div>
        <button className="btn-secondary" onClick={onExport}><Download size={16} /> CSV</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-3">Time</th>
              <th>Sender</th>
              <th>Receiver</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Risk</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="table-row">
                <td className="py-4 text-slate-400">{shortDate(tx.created_at)}</td>
                <td>{tx.sender_name || `User ${tx.sender_id}`}</td>
                <td>{tx.receiver_name || `User ${tx.receiver_id}`}</td>
                <td className="font-semibold">{currency(tx.amount)}</td>
                <td className="capitalize text-slate-300">{tx.status}</td>
                <td><RiskBadge level={tx.risk_level} /></td>
                <td>{tx.fraud_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
