import React, { useState } from 'react'

const fmt = (v) => {
  if (!v && v !== 0) return '—'
  if (v >= 10000000) return `₹${(v/10000000).toFixed(2)}Cr`
  if (v >= 100000)   return `₹${(v/100000).toFixed(2)}L`
  return `₹${v.toLocaleString('en-IN')}`
}

function project(lump, sip, years, blendedReturn) {
  const r = blendedReturn / 12
  const n = years * 12
  const lumpsumFV = lump * Math.pow(1 + blendedReturn, years)
  const sipFV = n > 0 ? sip * ((Math.pow(1 + r, n) - 1) / r) * (1 + r) : 0
  return Math.round(lumpsumFV + sipFV)
}

function getBlended(allocation) {
  const r = {
    equity: 0.13, debt: 0.075, gold: 0.08, cash: 0.06
  }
  return Object.entries(allocation).reduce((sum, [k, v]) => sum + (v/100) * (r[k] || 0.06), 0)
}

export default function WhatIfSimulator({ allocation, profile, projections }) {
  const baseSIP     = parseInt(profile.monthlySIP) || 0
  const baseLump    = parseInt(profile.lumpsumAmount) || 0
  const baseHorizon = parseInt(profile.timeHorizon) || 10
  const blended     = getBlended(allocation)

  const [extraSIP,      setExtraSIP]      = useState(0)
  const [extraLump,     setExtraLump]     = useState(0)
  const [horizonDelta,  setHorizonDelta]  = useState(0)
  const [marketCrash,   setMarketCrash]   = useState(0)   // % drawdown
  const [delayYears,    setDelayYears]    = useState(0)

  const newHorizon = Math.max(1, baseHorizon + parseInt(horizonDelta))

  // Base corpus (no changes)
  const baseCorpus = project(baseLump, baseSIP, baseHorizon, blended)

  // With extra SIP
  const withExtraSIP = project(baseLump, baseSIP + parseInt(extraSIP), newHorizon, blended)

  // With extra lumpsum
  const withExtraLump = project(baseLump + parseInt(extraLump), baseSIP, newHorizon, blended)

  // With market crash — equity portion drawdown then recovery
  const crashImpact = baseLump > 0
    ? Math.round(baseLump * (allocation.equity / 100) * (parseInt(marketCrash) / 100))
    : Math.round(baseCorpus * (allocation.equity / 100) * (parseInt(marketCrash) / 100))

  // Delay cost — what you lose by starting X years later
  const delayedCorpus = project(baseLump, baseSIP, Math.max(1, baseHorizon - parseInt(delayYears)), blended)
  const delayCost = baseCorpus - delayedCorpus

  const diff = (a, b) => {
    const d = a - b
    return { val: fmt(Math.abs(d)), positive: d > 0, zero: d === 0 }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h2 style={titleStyle}>What-If Simulator</h2>
        <p style={{ color:'var(--text-secondary)', fontSize:14, marginTop:4 }}>
          Adjust the sliders to see how changes affect your projected corpus. Base case: <strong style={{ color:'var(--gold)' }}>{fmt(baseCorpus)}</strong> in {baseHorizon} years.
        </p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Extra SIP */}
        <SimCard
          icon="💰"
          title="Increase Monthly SIP"
          description={`Current SIP: ₹${baseSIP.toLocaleString('en-IN')}/month`}
        >
          <SliderRow
            label="Additional SIP"
            value={extraSIP}
            min={0} max={50000} step={1000}
            onChange={setExtraSIP}
            display={`+₹${parseInt(extraSIP).toLocaleString('en-IN')}/mo`}
          />
          <Result
            label="New projected corpus"
            value={fmt(withExtraSIP)}
            delta={diff(withExtraSIP, baseCorpus)}
            note={`Total SIP: ₹${(baseSIP + parseInt(extraSIP)).toLocaleString('en-IN')}/mo`}
          />
        </SimCard>

        {/* Extra lumpsum */}
        <SimCard
          icon="🏦"
          title="Add Lumpsum Today"
          description={`Current lumpsum: ${fmt(baseLump)}`}
        >
          <SliderRow
            label="Additional Lumpsum"
            value={extraLump}
            min={0} max={5000000} step={50000}
            onChange={setExtraLump}
            display={`+${fmt(parseInt(extraLump))}`}
          />
          <Result
            label="New projected corpus"
            value={fmt(withExtraLump)}
            delta={diff(withExtraLump, baseCorpus)}
            note={`Total lumpsum: ${fmt(baseLump + parseInt(extraLump))}`}
          />
        </SimCard>

        {/* Extend horizon */}
        <SimCard
          icon="⏳"
          title="Change Time Horizon"
          description={`Current horizon: ${baseHorizon} years`}
        >
          <SliderRow
            label="Years to add / remove"
            value={horizonDelta}
            min={-5} max={15} step={1}
            onChange={setHorizonDelta}
            display={`${horizonDelta >= 0 ? '+' : ''}${horizonDelta} years → ${newHorizon} yrs`}
          />
          <Result
            label="Corpus at new horizon"
            value={fmt(project(baseLump, baseSIP, newHorizon, blended))}
            delta={diff(project(baseLump, baseSIP, newHorizon, blended), baseCorpus)}
            note={`Blended CAGR: ${(blended * 100).toFixed(1)}%`}
          />
        </SimCard>

        {/* Market crash */}
        <SimCard
          icon="📉"
          title="Market Crash Scenario"
          description="Simulates drawdown on equity portion"
        >
          <SliderRow
            label="Equity drawdown"
            value={marketCrash}
            min={0} max={50} step={5}
            onChange={setMarketCrash}
            display={`-${marketCrash}% crash`}
          />
          <div style={{ padding:'12px 14px', background:'rgba(239,68,68,0.08)', borderRadius:8, border:'1px solid rgba(239,68,68,0.15)', marginTop:8 }}>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>Estimated mark-to-market loss</div>
            <div style={{ fontFamily:'var(--font-mono)', fontSize:22, color:'#ef4444' }}>-{fmt(crashImpact)}</div>
            <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>
              Equity is {allocation.equity}% of portfolio · Markets historically recover in 2–5 years
            </div>
          </div>
        </SimCard>

        {/* Delay investing */}
        <SimCard
          icon="⏰"
          title="Cost of Delaying"
          description="What you lose by starting later"
        >
          <SliderRow
            label="Delay by (years)"
            value={delayYears}
            min={0} max={Math.min(baseHorizon - 1, 10)} step={1}
            onChange={setDelayYears}
            display={`${delayYears} year${delayYears !== 1 ? 's' : ''} delay`}
          />
          <Result
            label="Corpus if you delay"
            value={fmt(delayedCorpus)}
            delta={diff(delayedCorpus, baseCorpus)}
            note={`Opportunity cost: ${fmt(delayCost)}`}
            invert
          />
        </SimCard>

        {/* Blended return info */}
        <SimCard icon="📊" title="Your Blended Return" description="Based on your asset allocation">
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:8 }}>
            {[
              { label:'Equity', pct: allocation.equity, rate: 13, color:'#d4af37' },
              { label:'Debt',   pct: allocation.debt,   rate: 7.5, color:'#3b82f6' },
              { label:'Gold',   pct: allocation.gold,   rate: 8,   color:'#f59e0b' },
              { label:'Cash',   pct: allocation.cash,   rate: 6,   color:'#22c55e' },
            ].filter(r => r.pct > 0).map(r => (
              <div key={r.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:r.color, flexShrink:0 }}/>
                <div style={{ flex:1, fontSize:12, color:'var(--text-secondary)' }}>{r.label} ({r.pct}%)</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:r.color }}>{r.rate}% p.a.</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--text-muted)' }}>
                  → {((r.pct/100) * r.rate).toFixed(2)}%
                </div>
              </div>
            ))}
            <div style={{ borderTop:'1px solid var(--border)', paddingTop:10, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:13, color:'var(--text-secondary)', fontWeight:600 }}>Blended CAGR (base)</span>
              <span style={{ fontFamily:'var(--font-mono)', fontSize:20, color:'var(--gold)', fontWeight:600 }}>
                {(blended * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </SimCard>

      </div>

      <div style={{ padding:'12px 16px', background:'rgba(212,175,55,0.05)', border:'1px solid rgba(212,175,55,0.12)', borderRadius:8, fontSize:12, color:'var(--text-muted)', lineHeight:1.7 }}>
        ℹ️ All projections use base-case blended CAGR. Results are illustrative estimates only. Actual returns will vary based on market conditions.
      </div>
    </div>
  )
}

function SimCard({ icon, title, description, children }) {
  return (
    <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:24, display:'flex', flexDirection:'column', gap:16 }}>
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
          <span style={{ fontSize:20 }}>{icon}</span>
          <div style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:700, color:'var(--text-primary)' }}>{title}</div>
        </div>
        <div style={{ fontSize:12, color:'var(--text-muted)' }}>{description}</div>
      </div>
      {children}
    </div>
  )
}

function SliderRow({ label, value, min, max, step, onChange, display }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <label style={{ fontSize:12, color:'var(--text-secondary)' }}>{label}</label>
        <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--gold)', fontWeight:500 }}>{display}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ width:'100%', accentColor:'var(--gold)', cursor:'pointer' }}
      />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', fontFamily:'var(--font-mono)' }}>
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  )
}

function Result({ label, value, delta, note, invert }) {
  const isGood = invert ? !delta.positive : delta.positive
  return (
    <div style={{ padding:'12px 14px', background:'var(--bg-2)', borderRadius:8, border:'1px solid var(--border)' }}>
      <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:4 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-mono)', fontSize:22, color:'var(--gold)' }}>{value}</div>
      {!delta.zero && (
        <div style={{ fontSize:12, marginTop:4, color: isGood ? '#22c55e' : '#ef4444' }}>
          {delta.positive ? '▲' : '▼'} {delta.val} vs base
        </div>
      )}
      {note && <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{note}</div>}
    </div>
  )
}

const titleStyle = { fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--text-primary)' }
