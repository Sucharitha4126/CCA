import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage({ adminMode = false }) {
  const [email, setEmail] = useState(adminMode ? 'admin@sentinelpay.io' : 'maya@sentinelpay.io')
  const [password, setPassword] = useState(adminMode ? 'Admin@123' : 'User@123')
  const [loading, setLoading] = useState(false)
  const { login, logout } = useAuth()
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    setLoading(true)
    try {
      const data = await login(email, password)
      if (adminMode && data.role !== 'admin') {
        logout()
        toast.error('Admin account required')
        return
      }
      toast.success('Welcome back')
      navigate(data.role === 'admin' ? '/admin' : '/dashboard')
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 grid-bg">
      <form onSubmit={submit} className="glass w-full max-w-md rounded-lg p-7">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md bg-cyan-300/10 text-cyan-200"><ShieldCheck /></div>
          <h1 className="text-2xl font-bold">{adminMode ? 'Admin Login' : 'Login to Kavach'}</h1>
          <p className="mt-2 text-sm text-slate-400">{adminMode ? 'Administrator access for fraud monitoring and graph intelligence.' : 'Use the demo user credentials or your registered account.'}</p>
        </div>
        <div className="space-y-4">
          <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
          <input className="input" value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" />
          <button className="btn-primary w-full" disabled={loading}>{loading ? 'Signing in...' : adminMode ? 'Admin Login' : 'Login'}</button>
        </div>
        <p className="mt-5 text-center text-sm text-slate-400">{adminMode ? 'Customer account?' : 'No account?'} <Link className="text-cyan-200" to={adminMode ? '/login' : '/register'}>{adminMode ? 'User Login' : 'Register'}</Link></p>
      </form>
    </div>
  )
}
