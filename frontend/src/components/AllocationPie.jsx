import React, { useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './AllocationPie.module.css'

const COLORS = {
  equity: '#d4af37',
  debt:   '#3b82f6',
  gold:   '#f59e0b',
  cash:   '#22c55e'
}

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipLabel}>{d.name}</div>
      <div className={styles.tooltipValue}>{d.value}%</div>
    </div>
  )
}

export default function AllocationPie({ allocation, equitySubAlloc }) {
  const [activeIndex, setActiveIndex] = useState(null)
  const [view, setView] = useState('main') // 'main' | 'equity'

  const mainData = Object.entries(allocation)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v, key: k }))

  const equityData = equitySubAlloc ? [
    { name: 'Large Cap', value: equitySubAlloc.large, key: 'large' },
    { name: 'Mid Cap',   value: equitySubAlloc.mid,   key: 'mid' },
    { name: 'Small Cap', value: equitySubAlloc.small,  key: 'small' },
    ...(equitySubAlloc.intl > 0 ? [{ name: 'International', value: equitySubAlloc.intl, key: 'intl' }] : [])
  ].filter(d => d.value > 0) : []

  const EQUITY_COLORS = {
    large: '#d4af37', mid: '#f59e0b', small: '#fbbf24', intl: '#fcd34d'
  }

  const data = view === 'main' ? mainData : equityData
  const colorMap = view === 'main' ? COLORS : EQUITY_COLORS

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <h3 className={styles.title}>Portfolio Allocation</h3>
        <div className={styles.toggle}>
          <button className={`${styles.toggleBtn} ${view === 'main' ? styles.toggleActive : ''}`} onClick={() => setView('main')}>Overall</button>
          <button className={`${styles.toggleBtn} ${view === 'equity' ? styles.toggleActive : ''}`} onClick={() => setView('equity')}>Equity</button>
        </div>
      </div>

      <div className={styles.chartWrap}>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={72}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(null)}
              stroke="none"
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.key}
                  fill={colorMap[entry.key] || '#555'}
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                  style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div className={styles.center}>
          {activeIndex !== null && data[activeIndex] ? (
            <>
              <div className={styles.centerVal}>{data[activeIndex].value}%</div>
              <div className={styles.centerLabel}>{data[activeIndex].name}</div>
            </>
          ) : (
            <>
              <div className={styles.centerVal}>{view === 'main' ? allocation.equity : equitySubAlloc?.large}%</div>
              <div className={styles.centerLabel}>{view === 'main' ? 'Equity' : 'Large Cap'}</div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        {data.map((d, i) => (
          <div key={d.key} className={styles.legendItem}
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            <div className={styles.legendDot} style={{ background: colorMap[d.key] || '#555' }} />
            <span className={styles.legendLabel}>{d.name}</span>
            <span className={styles.legendVal}>{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
