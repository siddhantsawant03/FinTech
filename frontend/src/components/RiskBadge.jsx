import React from 'react'

const BUCKET_STYLES = {
  conservative:    { color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.2)' },
  mod_conservative:{ color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.2)' },
  mod_aggressive:  { color: '#d4af37', bg: 'rgba(212,175,55,0.1)',  border: 'rgba(212,175,55,0.2)' },
  aggressive:      { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)' },
  very_aggressive: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.2)' }
}

export default function RiskBadge({ bucket, label, score }) {
  const s = BUCKET_STYLES[bucket] || BUCKET_STYLES.mod_aggressive
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      borderRadius: 100,
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
      fontSize: 12,
      fontWeight: 600,
      flexShrink: 0
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', opacity: 0.7 }}>{score}</span>
      <span>·</span>
      <span>{label}</span>
    </div>
  )
}
