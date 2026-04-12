import React from 'react'
import styles from './MFCard.module.css'

const RISK_COLORS = {
  'Low':              '#22c55e',
  'Low to Moderate':  '#84cc16',
  'Moderate':         '#d4af37',
  'Moderately High':  '#f59e0b',
  'High':             '#f97316',
  'Very High':        '#ef4444'
}

export default function MFCard({ fund, sipAmount }) {
  const riskColor = RISK_COLORS[fund.riskOmeter] || '#888'

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <div className={styles.fundName}>{fund.name}</div>
          <div className={styles.amcName}>{fund.amcName || fund.name.split(' ')[0]}</div>
        </div>
        <div className={styles.riskBadge} style={{ color: riskColor, borderColor: riskColor + '33', background: riskColor + '11' }}>
          {fund.riskOmeter}
        </div>
      </div>

      {/* NAV */}
      <div className={styles.navRow}>
        <div className={styles.navVal}>
          {fund.nav ? `₹${fund.nav.toFixed(3)}` : 'NAV loading...'}
        </div>
        <div className={styles.navLabel}>Current NAV</div>
      </div>

      {/* Returns placeholder */}
      <div className={styles.returns}>
        {[
          { label: '1Y', value: fund.returns?.oneYear },
          { label: '3Y', value: fund.returns?.threeYear },
          { label: '5Y', value: fund.returns?.fiveYear }
        ].map(r => (
          <div key={r.label} className={styles.returnItem}>
            <div className={styles.returnLabel}>{r.label}</div>
            <div className={styles.returnVal}>
              {r.value !== null && r.value !== undefined ? `${r.value}%` : '—'}
            </div>
          </div>
        ))}
      </div>

      {/* Details */}
      <div className={styles.details}>
        <div className={styles.detail}>
          <span className={styles.detailLabel}>Exit Load</span>
          <span className={styles.detailVal}>{fund.exitLoad || '1% < 1yr'}</span>
        </div>
        <div className={styles.detail}>
          <span className={styles.detailLabel}>Min SIP</span>
          <span className={styles.detailVal}>₹{fund.minSIP?.toLocaleString('en-IN') || '500'}</span>
        </div>
      </div>

      {/* SIP suggestion */}
      {sipAmount > 0 && (
        <div className={styles.sipSuggestion}>
          <span>Suggested SIP</span>
          <strong>₹{sipAmount?.toLocaleString('en-IN')}/month</strong>
        </div>
      )}

      {/* AMFI link */}
      <a
        className={styles.amfiLink}
        href={`https://www.amfiindia.com/nav-history-download.html`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View on AMFI ↗
      </a>
    </div>
  )
}
