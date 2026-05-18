import { motion } from 'framer-motion'

export default function StatCard({ icon: Icon, label, value, tone = 'cyan', detail }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-lg p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`rounded-md border p-3 ${tone === 'violet' ? 'border-violet-300/30 bg-violet-400/10 text-violet-200' : 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200'}`}>
          <Icon size={22} />
        </div>
      </div>
      {detail && <p className="mt-4 text-sm text-slate-400">{detail}</p>}
    </motion.div>
  )
}
