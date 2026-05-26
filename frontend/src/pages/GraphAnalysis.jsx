import { useEffect, useRef, useState } from 'react'
import ForceGraph2D from 'react-force-graph-2d'
import { Maximize2, Network, RadioTower, Route, ShieldAlert, Workflow, ZoomIn, ZoomOut } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import StatCard from '../components/StatCard.jsx'
import Skeleton from '../components/Skeleton.jsx'
import { api } from '../api/client.js'

export default function GraphAnalysis() {
  const [graph, setGraph] = useState(null)
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    api.get('/api/graph').then(({ data }) => setGraph(data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (ref.current) ref.current.d3Force('charge').strength(-280)
  }, [graph])

  function zoom(delta) {
    if (!ref.current) return
    ref.current.zoom(ref.current.zoom() * delta, 400)
  }

  function fit() {
    ref.current?.zoomToFit(500, 48)
  }

  if (loading) return <Layout><Skeleton className="h-[640px]" /></Layout>

  return (
    <Layout>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-cyan-200">Admin graph intelligence</p>
          <h1 className="text-3xl font-bold">Fraud Network Analysis</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Admin-only visualization for transaction relationships, suspicious cycles, fraud chains, and Neo4j-style graph analytics.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          <RadioTower size={17} /> Live monitoring enabled
        </div>
      </div>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard icon={Network} label="Graph Nodes" value={graph?.analysis?.node_count || 0} />
        <StatCard icon={Workflow} label="Relationships" value={graph?.analysis?.edge_count || 0} tone="violet" />
        <StatCard icon={ShieldAlert} label="Suspicious Cycles" value={graph?.analysis?.cycles?.length || 0} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
        <div className="glass rounded-lg p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Transaction Network Graph</p>
              <p className="text-xs text-slate-500">Drag nodes, pan canvas, zoom to inspect suspicious relationships.</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="rounded-md border border-slate-700 p-2 text-slate-200 hover:bg-slate-900" onClick={() => zoom(1.25)} aria-label="Zoom in"><ZoomIn size={16} /></button>
              <button className="rounded-md border border-slate-700 p-2 text-slate-200 hover:bg-slate-900" onClick={() => zoom(0.8)} aria-label="Zoom out"><ZoomOut size={16} /></button>
              <button className="rounded-md border border-slate-700 p-2 text-slate-200 hover:bg-slate-900" onClick={fit} aria-label="Fit graph"><Maximize2 size={16} /></button>
            </div>
          </div>
          <div className="h-[520px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950 sm:h-[620px]">
            <ForceGraph2D
              ref={ref}
              graphData={{ nodes: graph?.nodes || [], links: graph?.links || [] }}
              nodeLabel={(node) => `${node.name} / Risk ${Math.round(node.risk || 0)}`}
              nodeColor={(node) => node.frozen ? '#fb7185' : node.suspicious ? '#fbbf24' : '#22d3ee'}
              linkColor={(link) => link.suspicious ? '#fb7185' : 'rgba(148, 163, 184, 0.55)'}
              linkWidth={(link) => link.suspicious ? 3 : 1.2}
              nodeCanvasObject={(node, ctx, globalScale) => {
                const label = node.name
                const fontSize = 12 / globalScale
                ctx.beginPath()
                ctx.arc(node.x, node.y, node.suspicious ? 8 : 6, 0, 2 * Math.PI, false)
                ctx.fillStyle = node.frozen ? '#fb7185' : node.suspicious ? '#fbbf24' : '#22d3ee'
                ctx.fill()
                ctx.font = `${fontSize}px Inter`
                ctx.fillStyle = '#e2e8f0'
                ctx.fillText(label, node.x + 10, node.y + 4)
              }}
            />
          </div>
        </div>
        <div className="glass rounded-lg p-5">
          <h3 className="text-lg font-bold">Analytics Sidebar</h3>
          <div className="mt-4 space-y-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-center gap-2 text-cyan-100"><Route size={18} /> Suspicious cycles</div>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                {(graph?.analysis?.cycles || []).length === 0 && <p>No cycles detected.</p>}
                {(graph?.analysis?.cycles || []).map((cycle, index) => <p key={index}>Cycle {index + 1}: {cycle.join(' -> ')} {'->'} {cycle[0]}</p>)}
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <p className="font-semibold">Suspicious account IDs</p>
              <p className="mt-2 text-sm text-slate-400">{(graph?.analysis?.suspicious_nodes || []).join(', ') || 'None'}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <p className="font-semibold">Neo4j Analytics</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-md bg-slate-900/80 p-3">
                  <p className="text-slate-500">Cycle scan</p>
                  <p className="mt-1 font-semibold text-white">Active</p>
                </div>
                <div className="rounded-md bg-slate-900/80 p-3">
                  <p className="text-slate-500">Node risk</p>
                  <p className="mt-1 font-semibold text-white">Colored</p>
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4">
              <p className="font-semibold">Legend</p>
              <div className="mt-3 space-y-2 text-sm text-slate-400">
                <p><span className="text-cyan-200">Cyan</span> normal account</p>
                <p><span className="text-amber-200">Amber</span> suspicious account or cycle</p>
                <p><span className="text-rose-200">Rose</span> frozen account or suspicious flow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
