import { BadgeCheck, CreditCard, Landmark } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { currency } from '../utils/format.js'

export default function ProfilePage() {
  const { user } = useAuth()
  const rows = [
    ['Full Name', user?.full_name || user?.name],
    ['Email', user?.email],
    ['Phone', user?.phone_number],
    ['Address', user?.address],
    ['Date of Birth', user?.dob],
    ['Account Number', user?.account_number],
    ['IFSC Code', user?.ifsc_code],
    ['Bank', user?.bank_name],
    ['Branch', user?.branch_name],
    ['Account Type', user?.account_type],
    ['PAN', user?.pan_number],
  ]

  return (
    <Layout>
      <div className="mb-7">
        <p className="text-sm text-cyan-200">Profile</p>
        <h1 className="text-3xl font-bold">Banking Profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Your simulated account and identity information used for secure transaction validation.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={CreditCard} label="Account Balance" value={currency(user?.balance)} detail="Stored account balance" />
        <StatCard icon={Landmark} label="Account Type" value={user?.account_type || 'Savings'} detail={user?.bank_name || 'Bank pending'} />
        <StatCard icon={BadgeCheck} label="Security Status" value={user?.is_frozen ? 'Frozen' : 'Active'} detail="Digital signature account enabled" tone="violet" />
      </div>
      <div className="mt-6 glass rounded-lg p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-md border border-slate-800 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 break-words font-semibold text-white">{value || 'Not provided'}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
