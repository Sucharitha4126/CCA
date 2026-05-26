import { Link, NavLink, useNavigate } from 'react-router-dom'
import { AlertTriangle, CreditCard, LayoutDashboard, LogOut, Menu, Network, Radar, ShieldCheck, User, Users, X } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

const userNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: CreditCard },
  { to: '/security', label: 'Security Center', icon: ShieldCheck },
  { to: '/profile', label: 'Profile', icon: User },
]

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/fraud-monitoring', label: 'Fraud Monitoring', icon: Radar },
  { to: '/graph-analysis', label: 'Graph Analysis', icon: Network },
  { to: '/admin/users', label: 'User Management', icon: Users },
  { to: '/admin/security', label: 'Security Analytics', icon: ShieldCheck },
  { to: '/admin/alerts', label: 'Alerts', icon: AlertTriangle },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isAdmin = user?.role === 'admin'
  const items = isAdmin ? adminNav : userNav
  const productLabel = isAdmin ? 'Fraud Intelligence' : 'Digital Banking'

  function signOut() {
    logout()
    navigate('/')
  }

  return (
    <div className="min-h-screen grid-bg">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-slate-800 bg-slate-950/90 px-5 py-6 backdrop-blur-xl lg:block">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-md bg-cyan-300/10 p-2 text-cyan-200"><ShieldCheck /></div>
          <div>
            <p className="font-bold text-white">Kavach</p>
            <p className="text-xs text-slate-400">{productLabel}</p>
          </div>
        </Link>
        <nav className="mt-10 space-y-2">
          {items.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-cyan-300/12 text-cyan-100' : 'text-slate-400 hover:bg-slate-900 hover:text-white'}`}>
              <item.icon size={18} /> {item.label}
            </NavLink>
          ))}
        </nav>
        {isAdmin && (
          <div className="mt-8 rounded-lg border border-cyan-300/15 bg-cyan-300/8 p-4 text-sm text-slate-300">
            <p className="font-semibold text-cyan-100">Admin-only graph suite</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">Fraud Intelligence, Suspicious Networks, and Live Monitoring are restricted to admin accounts.</p>
          </div>
        )}
        <div className="absolute bottom-6 left-5 right-5">
          <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-sm font-semibold">{user?.full_name || user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900" onClick={signOut}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <main className="lg:pl-72">
        <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/72 px-4 py-4 backdrop-blur-xl lg:hidden">
          <div className="flex items-center justify-between">
            <Link to="/" className="font-bold">Kavach</Link>
            <button className="rounded-md border border-slate-800 p-2 text-slate-200" onClick={() => setMobileOpen((value) => !value)} aria-label="Toggle navigation">
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
          {mobileOpen && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {items.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${isActive ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100' : 'border-slate-800 text-slate-300'}`}>
                  <item.icon size={16} /> {item.label}
                </NavLink>
              ))}
              <button className="flex items-center justify-center gap-2 rounded-md border border-slate-800 px-3 py-2 text-sm text-slate-300" onClick={signOut}><LogOut size={16} /> Logout</button>
            </div>
          )}
        </header>
        <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
