import { riskClass } from '../utils/format.js'

export default function RiskBadge({ level = 'LOW RISK' }) {
  return <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${riskClass(level)}`}>{level}</span>
}
