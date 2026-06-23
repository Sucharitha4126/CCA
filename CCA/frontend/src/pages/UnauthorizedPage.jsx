import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="grid min-h-screen place-items-center px-4 grid-bg">
      <div className="glass w-full max-w-lg rounded-lg p-7 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-md border border-rose-300/25 bg-rose-400/10 text-rose-200">
          <ShieldAlert />
        </div>
        <h1 className="mt-5 text-2xl font-bold">Unauthorized Access</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Graph analysis, suspicious network monitoring, Neo4j analytics, and admin controls are restricted to administrator accounts.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link className="btn-primary" to="/dashboard">User Dashboard</Link>
          <Link className="btn-secondary" to="/admin/login">Admin Login</Link>
        </div>
      </div>
    </div>
  )
}
