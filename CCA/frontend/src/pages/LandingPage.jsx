import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Area, AreaChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ArrowRight, LockKeyhole, Network, Radar, ShieldCheck, UserCog, Zap } from 'lucide-react'
import { features, riskTrend } from '../data/mock.js'

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden grid-bg">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-5 sm:px-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="rounded-md bg-cyan-300/10 p-2 text-cyan-200"><ShieldCheck /></div>
          <span className="font-bold">SentinelPay</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm text-slate-300 lg:flex">
          <a className="hover:text-white" href="#home">Home</a>
          <a className="hover:text-white" href="#features">Features</a>
          <a className="hover:text-white" href="#security">Security</a>
          <a className="hover:text-white" href="#about">About</a>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link className="btn-secondary px-3 py-2 text-sm sm:px-4 sm:py-2.5" to="/login"><UserCog size={16} /> Login</Link>
          <Link className="btn-primary px-3 py-2 text-sm sm:px-4 sm:py-2.5" to="/register">Register</Link>
        </div>
      </nav>

      <section id="home" className="mx-auto grid min-h-[calc(100vh-86px)] max-w-7xl items-center gap-10 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[1.03fr_.97fr]">
        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-5 inline-flex rounded-md border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
            AI fraud operations for cloud finance teams
          </div>
          <h1 className="max-w-4xl text-4xl font-extrabold leading-tight sm:text-6xl">
            SentinelPay Fraud Intelligence
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Monitor transactions in real time, score fraud risk with AI, expose suspicious money movement through graph analytics, and give admins the controls needed to stop risky accounts fast.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn-primary" to="/register">Launch platform <ArrowRight size={18} /></Link>
            <Link className="btn-secondary" to="/admin/login"><UserCog size={18} /> Admin Login</Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-3 text-center">
            {['WebSocket live feed', 'Neo4j graph rings', 'JWT secured APIs'].map((item) => (
              <div key={item} className="rounded-lg border border-slate-800 bg-slate-900/45 px-3 py-4 text-sm text-slate-300">{item}</div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-lg p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Fraud command preview</p>
              <h2 className="text-2xl font-bold">Risk Pulse</h2>
            </div>
            <div className="rounded-md bg-rose-400/12 px-3 py-2 text-sm text-rose-100">7 live alerts</div>
          </div>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={riskTrend}>
                <defs>
                  <linearGradient id="risk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }} />
                <Area type="monotone" dataKey="risk" stroke="#22d3ee" fill="url(#risk)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {[{ icon: Radar, label: 'AI Score' }, { icon: Network, label: 'Cycle Scan' }, { icon: LockKeyhole, label: 'Freeze Flow' }].map(({ icon: Icon, label }) => (
              <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                <Icon className="text-cyan-200" />
                <p className="mt-3 text-sm font-semibold">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <section id="features" className="border-y border-slate-800 bg-slate-950/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold">Built for fintech-grade monitoring</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature} className="glass rounded-lg p-5">
                <Zap className="text-violet-200" />
                <p className="mt-4 font-semibold">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section id="security" className="border-b border-slate-800 bg-slate-950/30 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3">
          {['Role-based access control', 'Admin-only graph intelligence', 'Signed transaction settlement'].map((item) => (
            <div key={item} className="glass rounded-lg p-5">
              <ShieldCheck className="text-cyan-200" />
              <p className="mt-4 font-semibold">{item}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">Designed for banking-grade workflows with clear separation between customer operations and fraud command tools.</p>
            </div>
          ))}
        </div>
      </section>
      <section id="about" className="mx-auto max-w-7xl px-4 py-14 text-sm leading-7 text-slate-400 sm:px-6">
        <p className="max-w-3xl">SentinelPay combines simulated digital banking, AI fraud scoring, transaction controls, and administrator-only network intelligence in a polished fintech SaaS experience.</p>
      </section>
      <footer className="mx-auto max-w-7xl px-4 py-8 text-sm text-slate-500 sm:px-6">SentinelPay Fraud Intelligence (c) 2026</footer>
    </div>
  )
}
