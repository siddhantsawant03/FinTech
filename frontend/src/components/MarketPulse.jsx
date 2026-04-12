// MarketPulse.jsx
import React from 'react'

export default function MarketPulse({ pulse }) {
  if (!pulse) return null
  const { status, gainers = [], losers = [] } = pulse

  return (
    <div style={card}>
      <div style={titleStyle}>Market Pulse</div>
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        <div style={{ ...badge, background: status?.isOpen ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: status?.isOpen ? '#22c55e' : '#ef4444', border: `1px solid ${status?.isOpen ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
          {status?.isOpen ? '● Market Open' : '● Market Closed'}
        </div>
        <div style={{ ...badge }}>{status?.time} IST</div>
      </div>

      {gainers.length > 0 && (
        <div style={{ marginBottom:12 }}>
          <div style={sectionLabel}>Top Gainers</div>
          {gainers.slice(0,3).map((g, i) => (
            <div key={i} style={tickerRow}>
              <span style={tickerSym}>{g.tradingSymbol || g.symbol}</span>
              <span style={{ color:'#22c55e', fontFamily:'var(--font-mono)', fontSize:12 }}>+{g.percentChange?.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      )}

      {losers.length > 0 && (
        <div>
          <div style={sectionLabel}>Top Losers</div>
          {losers.slice(0,3).map((g, i) => (
            <div key={i} style={tickerRow}>
              <span style={tickerSym}>{g.tradingSymbol || g.symbol}</span>
              <span style={{ color:'#ef4444', fontFamily:'var(--font-mono)', fontSize:12 }}>{g.percentChange?.toFixed(2)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const card = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:20 }
const titleStyle = { fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }
const badge = { padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:500 }
const sectionLabel = { fontSize:11, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }
const tickerRow = { display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--border)' }
const tickerSym = { fontSize:12, fontFamily:'var(--font-mono)', color:'var(--text-primary)' }
