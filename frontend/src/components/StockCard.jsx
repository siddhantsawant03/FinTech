import React from 'react'
import styles from './StockCard.module.css'

const SECTOR_COLORS = {
  'IT':           '#3b82f6',
  'Banking':      '#22c55e',
  'Energy':       '#f59e0b',
  'FMCG':         '#a78bfa',
  'Pharma':       '#ec4899',
  'Auto':         '#06b6d4',
  'Infrastructure':'#84cc16',
  'Telecom':      '#8b5cf6',
  'Consumer':     '#f97316',
  'Power':        '#fbbf24',
  'Cement':       '#94a3b8',
  'Paints':       '#e879f9',
  'Finance':      '#34d399',
  'Electronics':  '#38bdf8',
  'Pipes':        '#a3e635',
  'Engineering':  '#fb923c',
  'Chemicals':    '#c084fc',
  'Steel':        '#6b7280',
  'Sugar':        '#fde68a',
  'Plastics':     '#67e8f9',
}

export default function StockCard({ stock, liveQuote }) {
  const ltp = liveQuote?.ltp || liveQuote?.close || null
  const open = liveQuote?.open || null
  const high52 = liveQuote?.fiftyTwoWeekHigh || null
  const low52  = liveQuote?.fiftyTwoWeekLow  || null
  const change = ltp && open ? ltp - open : null
  const changePct = change && open ? (change / open) * 100 : null
  const isPositive = change >= 0

  const sectorColor = SECTOR_COLORS[stock.sector] || '#888'

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div className={styles.symbol}>{stock.symbol}</div>
          <div className={styles.name}>{stock.name}</div>
        </div>
        <div className={styles.sectorBadge} style={{ color: sectorColor, borderColor: sectorColor + '33', background: sectorColor + '11' }}>
          {stock.sector}
        </div>
      </div>

      {/* Price */}
      <div className={styles.priceRow}>
        <div className={styles.ltp}>
          {ltp ? `₹${ltp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '—'}
        </div>
        {changePct !== null && (
          <div className={`${styles.change} ${isPositive ? styles.positive : styles.negative}`}>
            {isPositive ? '▲' : '▼'} {Math.abs(changePct).toFixed(2)}%
          </div>
        )}
        {!ltp && <div className={styles.noPrice}>Live price unavailable</div>}
      </div>

      {/* 52w range */}
      {high52 && low52 && ltp && (
        <div className={styles.rangeWrap}>
          <div className={styles.rangeLabel}>
            <span>52W Low ₹{low52.toLocaleString('en-IN')}</span>
            <span>52W High ₹{high52.toLocaleString('en-IN')}</span>
          </div>
          <div className={styles.rangeBar}>
            <div className={styles.rangeFill}
              style={{ left: `${((low52 / high52) * 100)}%`, width: `${((ltp - low52) / (high52 - low52)) * 100}%` }}
            />
            <div className={styles.rangeDot}
              style={{ left: `${((ltp - low52) / (high52 - low52)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Fundamentals */}
      {stock.fundamentals && (
        <div className={styles.fundamentals}>
          <Metric label="D/E"  value={stock.fundamentals.debtToEquity} good={stock.fundamentals.debtToEquity < 1} />
          <Metric label="EPS"  value={`₹${stock.fundamentals.eps}`} good={stock.fundamentals.eps > 0} />
          <Metric label="P/E"  value={stock.fundamentals.pe} good={stock.fundamentals.pe > 0 && stock.fundamentals.pe < 40} />
          <Metric label="Div%" value={`${stock.fundamentals.dividendYield}%`} good={stock.fundamentals.dividendYield > 0} />
        </div>
      )}

      {/* Why tag */}
      <div className={styles.why}>
        <span className={styles.whyIcon}>◎</span>
        {getWhyText(stock)}
      </div>

      <div className={styles.disclaimer}>For consideration only — not a buy call</div>
    </div>
  )
}

function Metric({ label, value, good }) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricLabel}>{label}</div>
      <div className={`${styles.metricVal} ${good ? styles.metricGood : styles.metricNeutral}`}>{value}</div>
    </div>
  )
}

function getWhyText(stock) {
  const { fundamentals } = stock
  if (!fundamentals) return 'NSE 500 universe · Passed screening filters'
  const parts = []
  if (fundamentals.debtToEquity < 0.5) parts.push('Low debt')
  if (fundamentals.eps > 50) parts.push('Strong EPS')
  if (fundamentals.dividendYield > 1.5) parts.push('Dividend yield')
  if (fundamentals.pe < 20) parts.push('Reasonable valuation')
  parts.push(stock.sector + ' sector')
  return parts.join(' · ')
}
