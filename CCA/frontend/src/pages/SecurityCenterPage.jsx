import { Fingerprint, KeyRound, LockKeyhole, ShieldCheck, ShieldAlert } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import StatCard from '../components/StatCard.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function SecurityCenterPage() {
  const { user } = useAuth()
  const signatureReady = Boolean(user?.public_key)

  return (
    <Layout>
      <div className="mb-7">
        <p className="text-sm text-cyan-200">Security Center</p>
        <h1 className="text-3xl font-bold">Account Security</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Manage digital signature readiness and review account protection signals. Fraud network analytics remain admin-only.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={Fingerprint} label="Digital Signature" value={signatureReady ? 'Enabled' : 'Pending'} detail="RSA-backed simulated transaction signing" />
        <StatCard icon={ShieldCheck} label="Account Status" value={user?.is_frozen ? 'Frozen' : 'Active'} detail="Frozen accounts cannot transfer funds" />
        <StatCard icon={ShieldAlert} label="Fraud Risk Score" value={`${Math.round(user?.risk_score || 0)}/100`} tone="violet" detail="Updated after transaction checks" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-bold">Digital Signature Settings</h3>
          <div className="mt-4 space-y-3">
            {[
              ['Public key generated', signatureReady],
              ['Private key encrypted', user?.signature_enabled],
              ['Transaction signature required', true],
              ['Balance validation before transfer', true],
            ].map(([label, active]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-md border border-slate-800 bg-slate-950/60 px-4 py-3">
                <span className="text-sm text-slate-300">{label}</span>
                <span className={`rounded-md px-2 py-1 text-xs font-semibold ${active ? 'bg-emerald-400/10 text-emerald-200' : 'bg-amber-400/10 text-amber-200'}`}>{active ? 'Active' : 'Pending'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-bold">Protection Rules</h3>
          <div className="mt-4 grid gap-3">
            {[
              { icon: LockKeyhole, label: 'JWT-authenticated sessions' },
              { icon: KeyRound, label: 'Encrypted simulated private key' },
              { icon: ShieldCheck, label: 'No overdraft settlement' },
              { icon: ShieldAlert, label: 'AI risk scoring before transfer' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                <Icon size={18} className="text-cyan-200" /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
