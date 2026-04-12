import React from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function buildChartData(projections, profile) {
  const { monthlySIP, lumpsumAmount, timeHorizon } = profile
  const sip = parseInt(monthlySIP) || 0
  const lump = parseInt(lumpsumAmount) || 0
  const years = parseInt(timeHorizon) || 10
  const data = []

  for (let y = 0; y <= years; y++) {
    const invested = lump + sip * 12 * y
    const entry = { year: `Yr ${y}`, invested }
    for (const [scenario, rates] of Object.entries({ conservative: 0.10, base: 0.13, optimistic: 0.16 })) {
      const r = rates / 12
      const n = y * 12
      entry[scenario] = Math.round(lump * Math.pow(1 + rates, y) + (n > 0 ? sip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : 0))
    }
    data.push(entry)
  }
  return data
}

const fmt = (v) => {
  if (v >= 10000000) return `₹${(v/10000000).toFixed(1)}Cr`
  if (v >= 100000) return `₹${(v/100000).toFixed(1)}L`
  return `₹${v.toLocaleString('en-IN')}`
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'var(--bg-1)', border:'1px solid var(--border-accent)', borderRadius:8, padding:'12px 16px' }}>
      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:8 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display:'flex', justifyContent:'space-between', gap:16, marginBottom:4 }}>
          <span style={{ fontSize:12, color: p.stroke }}>{p.name}</span>
          <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:p.stroke }}>{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function ProjectionChart({ projections, profile, sipAllocation }) {
  const data = buildChartData(projections, profile)
  const { base } = projections

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {[
          { label:'Conservative', key:'conservative', color:'#3b82f6' },
          { label:'Base Case',    key:'base',         color:'#d4af37' },
          { label:'Optimistic',   key:'optimistic',   color:'#22c55e' }
        ].map(s => (
          <div key={s.key} style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:20, textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:28, fontWeight:600, color: s.color, marginBottom:4 }}>
              {fmt(projections[s.key]?.futureValue)}
            </div>
            <div style={{ fontSize:11, color:'var(--text-muted)' }}>{projections[s.key]?.blendedCAGR}% blended CAGR</div>
            <div style={{ marginTop:8, fontSize:12, color:'var(--text-secondary)' }}>
              Wealth gain: {fmt(projections[s.key]?.wealthGain)}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:28 }}>
        <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, color:'var(--text-primary)', marginBottom:24 }}>
          Corpus Growth Projection — {profile.timeHorizon} Years
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
            <defs>
              {[['conservative','#3b82f6'],['base','#d4af37'],['optimistic','#22c55e'],['invested','#555']].map(([key, color]) => (
                <linearGradient key={key} id={`grad_${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="year" tick={{ fill:'#55667a', fontSize:11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmt} tick={{ fill:'#55667a', fontSize:11 }} axisLine={false} tickLine={false} width={80} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="invested"     stroke="#555"    fill="url(#grad_invested)"     strokeWidth={1} strokeDasharray="4 4" name="Amount Invested" />
            <Area type="monotone" dataKey="conservative" stroke="#3b82f6" fill="url(#grad_conservative)" strokeWidth={2} name="Conservative" />
            <Area type="monotone" dataKey="base"         stroke="#d4af37" fill="url(#grad_base)"         strokeWidth={2.5} name="Base Case" />
            <Area type="monotone" dataKey="optimistic"   stroke="#22c55e" fill="url(#grad_optimistic)"   strokeWidth={2} name="Optimistic" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ padding:'14px 18px', background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.15)', borderRadius:10, fontSize:12, color:'var(--text-muted)', lineHeight:1.7 }}>
        📊 Projections use blended CAGR based on 20-year historical return assumptions per asset class. Conservative assumes equity 10%/debt 6%/gold 6%, Base assumes equity 13%/debt 7.5%/gold 8%, Optimistic assumes equity 16%/debt 9%/gold 11%. Past returns do not guarantee future performance.
      </div>
    </div>
  )
}
