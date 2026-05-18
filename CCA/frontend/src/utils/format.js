export function currency(value) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value || 0))
}

export function shortDate(value) {
  if (!value) return 'Now'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export function riskClass(level) {
  if (level === 'HIGH RISK') return 'border-rose-400/40 bg-rose-500/15 text-rose-200'
  if (level === 'MEDIUM RISK') return 'border-amber-400/40 bg-amber-500/15 text-amber-200'
  return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
}
