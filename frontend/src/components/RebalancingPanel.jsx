import React from 'react'

export default function RebalancingPanel({ alerts, target }) {
  const s = { card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:28 } }

  if (!alerts || alerts.length === 0) {
    return (
      <div style={s.card}>
        <h2 style={title}>Portfolio Rebalancing</h2>
        <div style={{ textAlign:'center', padding:'60px 40px' }}>
          <div style={{ fontSize:40, marginBottom:16 }}>✅</div>
          <h3 style={{ fontFamily:'var(--font-display)', fontSize:20, color:'var(--text-primary)', marginBottom:8 }}>Portfolio is balanced</h3>
          <p style={{ color:'var(--text-secondary)', fontSize:14, lineHeight:1.6 }}>
            All asset classes are within ±5% of their target allocation. No rebalancing needed right now.
          </p>
          <p style={{ color:'var(--text-muted)', fontSize:12, marginTop:16 }}>
            Rebalancing check runs against your live Angel One holdings. If no holdings are imported, connect your account for live drift tracking.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={s.card}>
        <h2 style={title}>Rebalancing Alerts</h2>
        <p style={{ color:'var(--text-secondary)', fontSize:13, marginBottom:24 }}>
          The following asset classes have drifted more than 5% from their target allocation.
        </p>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:16,
              padding:'16px 20px',
              background:'var(--bg-2)',
              border:`1px solid ${a.action === 'reduce' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`,
              borderRadius:12
            }}>
              <div style={{ fontSize:24 }}>{a.action === 'reduce' ? '📉' : '📈'}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--font-display)', fontWeight:700, color:'var(--text-primary)', textTransform:'capitalize' }}>
                  {a.asset}
                </div>
                <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>
                  Current: {a.current}% → Target: {a.target}% (drift: {a.drift}%)
                </div>
              </div>
              <div style={{
                padding:'5px 14px', borderRadius:100, fontSize:12, fontWeight:600,
                background: a.action === 'reduce' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                color: a.action === 'reduce' ? '#ef4444' : '#22c55e',
                border: `1px solid ${a.action === 'reduce' ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.2)'}`
              }}>
                {a.action === 'reduce' ? 'Reduce' : 'Increase'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...s.card, background:'rgba(245,158,11,0.05)', border:'1px solid rgba(245,158,11,0.15)' }}>
        <p style={{ fontSize:12, color:'var(--amber)', lineHeight:1.6 }}>
          ⚠️ Rebalancing suggestions are based on your imported Angel One holdings vs the target allocation computed by the engine. Always consult a financial advisor before making changes to your portfolio.
        </p>
      </div>
    </div>
  )
}

const title = { fontFamily:'var(--font-display)', fontSize:22, fontWeight:800, color:'var(--text-primary)', marginBottom:8 }
