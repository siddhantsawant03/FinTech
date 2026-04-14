// import { useState, useEffect, useCallback, useRef } from 'react';
// import styles from './MarketDashboardPage.module.css';

// // ── tiny sparkline (SVG) ─────────────────────────────────────────────────────
// function Sparkline({ data = [], color = '#00e5a0', height = 48, width = 140 }) {
//   if (!data.length) return <div className={styles.sparkPlaceholder} />;
//   const vals = data.map(d => d.close ?? d);
//   const min = Math.min(...vals);
//   const max = Math.max(...vals);
//   const range = max - min || 1;
//   const pts = vals
//     .map((v, i) => `${(i / (vals.length - 1)) * width},${height - ((v - min) / range) * height}`)
//     .join(' ');
//   return (
//     <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} style={{ overflow: 'visible' }}>
//       <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
//     </svg>
//   );
// }

// // ── flow bar (FII / DII) ─────────────────────────────────────────────────────
// function FlowBar({ buy = 0, sell = 0, net = 0, label, color }) {
//   const total = buy + sell || 1;
//   const buyPct = (buy / total) * 100;
//   const isPositive = net >= 0;
//   return (
//     <div className={styles.flowCard}>
//       <div className={styles.flowHeader}>
//         <span className={styles.flowLabel}>{label}</span>
//         <span className={`${styles.flowNet} ${isPositive ? styles.positive : styles.negative}`}>
//           {isPositive ? '▲' : '▼'} ₹{Math.abs(net).toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr
//         </span>
//       </div>
//       <div className={styles.flowBar}>
//         <div className={styles.flowBuy} style={{ width: `${buyPct}%`, background: color }} />
//         <div className={styles.flowSell} style={{ width: `${100 - buyPct}%` }} />
//       </div>
//       <div className={styles.flowFooter}>
//         <span className={styles.flowBuyText}>Buy ₹{buy.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr</span>
//         <span className={styles.flowSellText}>Sell ₹{sell.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Cr</span>
//       </div>
//     </div>
//   );
// }

// // ── index card ───────────────────────────────────────────────────────────────
// function IndexCard({ name, ltp, change, pChange, pe, pb, high, low, spark = [], accent }) {
//   const up = (pChange ?? 0) >= 0;
//   const fmt = v => v != null ? Number(v).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '—';
//   return (
//     <div className={`${styles.indexCard}`} style={{ '--accent': accent }}>
//       <div className={styles.indexTop}>
//         <span className={styles.indexName}>{name}</span>
//         <span className={`${styles.indexChange} ${up ? styles.positive : styles.negative}`}>
//           {up ? '+' : ''}{fmt(pChange)}%
//         </span>
//       </div>
//       <div className={styles.indexLtp}>{fmt(ltp)}</div>
//       <div className={styles.indexMeta}>
//         <span className={`${styles.indexNet} ${up ? styles.positive : styles.negative}`}>
//           {up ? '+' : ''}{fmt(change)}
//         </span>
//         {pe && <span className={styles.indexPE}>P/E {pe}</span>}
//       </div>
//       <div className={styles.sparkRow}>
//         <Sparkline data={spark} color={up ? '#00e5a0' : '#ff5f5f'} />
//         <div className={styles.hlBox}>
//           <span>H {fmt(high)}</span>
//           <span>L {fmt(low)}</span>
//           {pb && <span>P/B {pb}</span>}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── breadth donut ────────────────────────────────────────────────────────────
// function BreadthDonut({ advances = 0, declines = 0, unchanged = 0 }) {
//   const total = advances + declines + unchanged || 1;
//   const advPct = (advances / total) * 100;
//   const decPct = (declines / total) * 100;
//   // SVG donut via conic-gradient trick
//   const r = 38, cx = 50, cy = 50, circ = 2 * Math.PI * r;
//   const advDash = (advPct / 100) * circ;
//   const decDash = (decPct / 100) * circ;
//   const unchDash = circ - advDash - decDash;
//   return (
//     <div className={styles.breadthCard}>
//       <h3 className={styles.cardTitle}>Market Breadth <span className={styles.sub}>NIFTY 50</span></h3>
//       <div className={styles.breadthInner}>
//         <svg viewBox="0 0 100 100" width="120" height="120">
//           <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1a2236" strokeWidth="14" />
//           <circle cx={cx} cy={cy} r={r} fill="none" stroke="#00e5a0" strokeWidth="14"
//             strokeDasharray={`${advDash} ${circ - advDash}`}
//             strokeDashoffset={circ * 0.25} strokeLinecap="round" />
//           <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ff5f5f" strokeWidth="14"
//             strokeDasharray={`${decDash} ${circ - decDash}`}
//             strokeDashoffset={circ * 0.25 - advDash} strokeLinecap="round" />
//           <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3a4a6a" strokeWidth="14"
//             strokeDasharray={`${unchDash} ${circ - unchDash}`}
//             strokeDashoffset={circ * 0.25 - advDash - decDash} strokeLinecap="round" />
//           <text x="50" y="46" textAnchor="middle" fill="#e8eaf6" fontSize="14" fontWeight="700">{advances}</text>
//           <text x="50" y="60" textAnchor="middle" fill="#8899bb" fontSize="8">ADV</text>
//         </svg>
//         <div className={styles.breadthLegend}>
//           <div><span className={styles.dot} style={{ background: '#00e5a0' }} /> Advances <b>{advances}</b></div>
//           <div><span className={styles.dot} style={{ background: '#ff5f5f' }} /> Declines <b>{declines}</b></div>
//           <div><span className={styles.dot} style={{ background: '#3a4a6a' }} /> Unchanged <b>{unchanged}</b></div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── mini stat card ───────────────────────────────────────────────────────────
// function StatCard({ label, value, sub, icon, color, note }) {
//   return (
//     <div className={styles.statCard} style={{ '--c': color }}>
//       <div className={styles.statIcon}>{icon}</div>
//       <div className={styles.statBody}>
//         <div className={styles.statLabel}>{label}</div>
//         <div className={styles.statValue}>{value ?? '—'}</div>
//         {sub && <div className={styles.statSub}>{sub}</div>}
//         {note && <div className={styles.statNote}>{note}</div>}
//       </div>
//     </div>
//   );
// }

// // ── FII/DII mini history bar chart ───────────────────────────────────────────
// function FlowHistory({ history = [] }) {
//   if (!history.length) return null;
//   const vals = history.flatMap(h => [h.fiiNet, h.diiNet]);
//   const max = Math.max(...vals.map(Math.abs), 1);
//   return (
//     <div className={styles.flowHistoryCard}>
//       <h3 className={styles.cardTitle}>FII / DII Flow — Last 10 Sessions</h3>
//       <div className={styles.flowHistChart}>
//         {[...history].reverse().map((h, i) => (
//           <div key={i} className={styles.flowHistCol}>
//             <div className={styles.flowHistBars}>
//               <div className={styles.flowHistBar}
//                 style={{ height: `${(Math.abs(h.fiiNet) / max) * 80}px`, background: h.fiiNet >= 0 ? '#00e5a0' : '#ff5f5f', opacity: 0.9 }}
//                 title={`FII: ₹${h.fiiNet.toFixed(0)} Cr`} />
//               <div className={styles.flowHistBar}
//                 style={{ height: `${(Math.abs(h.diiNet) / max) * 80}px`, background: h.diiNet >= 0 ? '#4fa6ff' : '#ff9f43', opacity: 0.9 }}
//                 title={`DII: ₹${h.diiNet.toFixed(0)} Cr`} />
//             </div>
//             <div className={styles.flowHistDate}>{h.date?.slice(0, 5)}</div>
//           </div>
//         ))}
//       </div>
//       <div className={styles.flowHistLegend}>
//         <span><span className={styles.dot} style={{ background: '#00e5a0' }} /> FII Inflow</span>
//         <span><span className={styles.dot} style={{ background: '#ff5f5f' }} /> FII Outflow</span>
//         <span><span className={styles.dot} style={{ background: '#4fa6ff' }} /> DII Inflow</span>
//         <span><span className={styles.dot} style={{ background: '#ff9f43' }} /> DII Outflow</span>
//       </div>
//     </div>
//   );
// }

// // ═══════════════════════════════════════════════════════════════════════════════
// // MAIN PAGE
// // ═══════════════════════════════════════════════════════════════════════════════
// const REFRESH_MS = 60_000; // refresh every 60 seconds

// export default function MarketDashboardPage() {
//   const [data, setData] = useState(null);
//   const [niftyCandles, setNiftyCandles] = useState([]);
//   const [sensexCandles, setSensexCandles] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [lastRefresh, setLastRefresh] = useState(null);
//   const intervalRef = useRef(null);

//   const getToken = () => localStorage.getItem('jwtToken') || sessionStorage.getItem('jwtToken');

//   const fetchData = useCallback(async () => {
//     const token = getToken();
//     if (!token) { setError('Not logged in. Please login first.'); setLoading(false); return; }

//     try {
//       const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
//       const base = import.meta.env.VITE_API_URL || 'http://localhost:3001';

//       const [marketRes, niftyRes, sensexRes] = await Promise.all([
//         fetch(`${base}/api/dashboard/market`, { headers }),
//         fetch(`${base}/api/dashboard/candles/99926000?interval=FIVE_MINUTE&exchange=NSE`, { headers }),
//         fetch(`${base}/api/dashboard/candles/99919000?interval=FIVE_MINUTE&exchange=BSE`, { headers }),
//       ]);

//       if (!marketRes.ok) throw new Error(`Market API error ${marketRes.status}`);

//       const market = await marketRes.json();
//       const niftyC = niftyRes.ok ? await niftyRes.json() : { candles: [] };
//       const sensexC = sensexRes.ok ? await sensexRes.json() : { candles: [] };

//       setData(market.data);
//       setNiftyCandles(niftyC.candles || []);
//       setSensexCandles(sensexC.candles || []);
//       setLastRefresh(new Date());
//       setError(null);
//     } catch (e) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     fetchData();
//     intervalRef.current = setInterval(fetchData, REFRESH_MS);
//     return () => clearInterval(intervalRef.current);
//   }, [fetchData]);

//   const indices = data?.indices || {};
//   const fiiDii = data?.fiiDii || {};
//   const usdInr = data?.usdInr || {};
//   const repoRate = data?.repoRate || {};
//   const breadth = data?.breadth || {};

//   if (loading) return (
//     <div className={styles.loadState}>
//       <div className={styles.pulseRing} />
//       <p>Fetching live market data…</p>
//     </div>
//   );

//   if (error) return (
//     <div className={styles.errorState}>
//       <span className={styles.errorIcon}>⚠</span>
//       <p>{error}</p>
//       <button onClick={fetchData} className={styles.retryBtn}>Retry</button>
//     </div>
//   );

//   return (
//     <div className={styles.page}>
//       {/* ── Header ── */}
//       <div className={styles.header}>
//         <div>
//           <h1 className={styles.title}>Market Dashboard</h1>
//           <p className={styles.subtitle}>Live insights · Indian Equity Markets</p>
//         </div>
//         <div className={styles.headerRight}>
//           <div className={styles.liveChip}>
//             <span className={styles.liveDot} />
//             LIVE
//           </div>
//           <button onClick={fetchData} className={styles.refreshBtn} title="Refresh now">↻ Refresh</button>
//           {lastRefresh && (
//             <span className={styles.lastRefresh}>
//               Updated {lastRefresh.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
//             </span>
//           )}
//         </div>
//       </div>

//       {/* ── Index Cards ── */}
//       <section className={styles.section}>
//         <h2 className={styles.sectionTitle}>Indices</h2>
//         <div className={styles.indexGrid}>
//           <IndexCard name="NIFTY 50" ltp={indices.nifty?.ltp} change={indices.nifty?.change}
//             pChange={indices.nifty?.pChange} pe={indices.nifty?.niftyPE} pb={indices.nifty?.niftyPB}
//             high={indices.nifty?.high} low={indices.nifty?.low} spark={niftyCandles} accent="#00e5a0" />
//           <IndexCard name="SENSEX" ltp={indices.sensex?.ltp} change={indices.sensex?.change}
//             pChange={indices.sensex?.pChange} pe={indices.sensex?.sensexPE} pb={indices.sensex?.sensexPB}
//             high={indices.sensex?.high} low={indices.sensex?.low} spark={sensexCandles} accent="#4fa6ff" />
//           <IndexCard name="BANK NIFTY" ltp={indices.bankNifty?.ltp} change={indices.bankNifty?.change}
//             pChange={indices.bankNifty?.pChange} accent="#b48aff" />
//           <IndexCard name="NIFTY MIDCAP" ltp={indices.niftyMidcap?.ltp} change={indices.niftyMidcap?.change}
//             pChange={indices.niftyMidcap?.pChange} accent="#ffd166" />
//         </div>
//       </section>

//       {/* ── Macro Stats ── */}
//       <section className={styles.section}>
//         <h2 className={styles.sectionTitle}>Macro Indicators</h2>
//         <div className={styles.statsGrid}>
//           <StatCard icon="💱" label="USD / INR" color="#ffd166"
//             value={usdInr.rate ? `₹ ${usdInr.rate}` : '—'}
//             sub="Live forex rate" />
//           <StatCard icon="🏦" label="RBI Repo Rate" color="#4fa6ff"
//             value={repoRate.rate ? `${repoRate.rate}%` : '—'}
//             sub={`Updated ${repoRate.lastUpdated || '—'}`}
//             note={repoRate.note} />
//           <StatCard icon="📊" label="Nifty P/E" color="#00e5a0"
//             value={indices.nifty?.niftyPE ?? '—'}
//             sub={`P/B: ${indices.nifty?.niftyPB ?? '—'}`} />
//           <StatCard icon="📈" label="Sensex P/E" color="#b48aff"
//             value={indices.sensex?.sensexPE ?? '—'}
//             sub={`P/B: ${indices.sensex?.sensexPB ?? '—'}`} />
//         </div>
//       </section>

//       {/* ── FII / DII Flow ── */}
//       <section className={styles.section}>
//         <h2 className={styles.sectionTitle}>
//           FII &amp; DII Flows
//           <span className={styles.sub}>{fiiDii.date || ''}</span>
//         </h2>
//         <div className={styles.flowGrid}>
//           <FlowBar label="FII (Foreign Institutional)"
//             buy={fiiDii.fii?.buyValue} sell={fiiDii.fii?.sellValue} net={fiiDii.fii?.netValue}
//             color="#00e5a0" />
//           <FlowBar label="DII (Domestic Institutional)"
//             buy={fiiDii.dii?.buyValue} sell={fiiDii.dii?.sellValue} net={fiiDii.dii?.netValue}
//             color="#4fa6ff" />
//         </div>
//         <FlowHistory history={fiiDii.history || []} />
//       </section>

//       {/* ── Market Breadth ── */}
//       <section className={styles.section}>
//         <BreadthDonut
//           advances={breadth.advances} declines={breadth.declines} unchanged={breadth.unchanged} />
//       </section>

//       {/* ── Footer ── */}
//       <div className={styles.footer}>
//         Data sourced from Angel One SmartAPI · NSE India · BSE India · RBI
//         <br />Auto-refreshes every 60 seconds during market hours.
//       </div>
//     </div>
//   );
// }

import { useState, useEffect, useCallback, useRef } from "react";
import { useStore } from "../store";
import api from "../store";
import styles from "./MarketDashboardPage.module.css";

// ── tiny sparkline (SVG) ─────────────────────────────────────────────────────
function Sparkline({ data = [], color = "#00e5a0", height = 48, width = 140 }) {
  if (!data.length) return <div className={styles.sparkPlaceholder} />;
  const vals = data.map((d) => d.close ?? d);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals
    .map(
      (v, i) =>
        `${(i / (vals.length - 1)) * width},${
          height - ((v - min) / range) * height
        }`,
    )
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      style={{ overflow: "visible" }}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FlowBar({ buy = 0, sell = 0, net = 0, label, color }) {
  const total = buy + sell || 1;
  const buyPct = (buy / total) * 100;
  const isPositive = net >= 0;
  return (
    <div className={styles.flowCard}>
      <div className={styles.flowHeader}>
        <span className={styles.flowLabel}>{label}</span>
        <span
          className={`${styles.flowNet} ${
            isPositive ? styles.positive : styles.negative
          }`}
        >
          {isPositive ? "▲" : "▼"} ₹
          {Math.abs(net).toLocaleString("en-IN", { maximumFractionDigits: 0 })}{" "}
          Cr
        </span>
      </div>
      <div className={styles.flowBar}>
        <div
          className={styles.flowBuy}
          style={{ width: `${buyPct}%`, background: color }}
        />
        <div
          className={styles.flowSell}
          style={{ width: `${100 - buyPct}%` }}
        />
      </div>
      <div className={styles.flowFooter}>
        <span className={styles.flowBuyText}>
          Buy ₹{buy.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr
        </span>
        <span className={styles.flowSellText}>
          Sell ₹{sell.toLocaleString("en-IN", { maximumFractionDigits: 0 })} Cr
        </span>
      </div>
    </div>
  );
}

function IndexCard({
  name,
  ltp,
  change,
  pChange,
  pe,
  pb,
  high,
  low,
  spark = [],
  accent,
}) {
  const up = (pChange ?? 0) >= 0;
  const fmt = (v) =>
    v != null
      ? Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : "—";
  return (
    <div className={styles.indexCard} style={{ "--accent": accent }}>
      <div className={styles.indexTop}>
        <span className={styles.indexName}>{name}</span>
        <span
          className={`${styles.indexChange} ${
            up ? styles.positive : styles.negative
          }`}
        >
          {up ? "+" : ""}
          {fmt(pChange)}%
        </span>
      </div>
      <div className={styles.indexLtp}>{fmt(ltp)}</div>
      <div className={styles.indexMeta}>
        <span
          className={`${styles.indexNet} ${
            up ? styles.positive : styles.negative
          }`}
        >
          {up ? "+" : ""}
          {fmt(change)}
        </span>
        {pe && <span className={styles.indexPE}>P/E {pe}</span>}
      </div>
      <div className={styles.sparkRow}>
        <Sparkline data={spark} color={up ? "#00e5a0" : "#ff5f5f"} />
        <div className={styles.hlBox}>
          <span>H {fmt(high)}</span>
          <span>L {fmt(low)}</span>
          {pb && <span>P/B {pb}</span>}
        </div>
      </div>
    </div>
  );
}

function BreadthDonut({ advances = 0, declines = 0, unchanged = 0 }) {
  const total = advances + declines + unchanged || 1;
  const advPct = (advances / total) * 100;
  const decPct = (declines / total) * 100;
  const r = 38,
    cx = 50,
    cy = 50,
    circ = 2 * Math.PI * r;
  const advDash = (advPct / 100) * circ;
  const decDash = (decPct / 100) * circ;
  const unchDash = circ - advDash - decDash;
  return (
    <div className={styles.breadthCard}>
      <h3 className={styles.cardTitle}>
        Market Breadth <span className={styles.sub}>NIFTY 50</span>
      </h3>
      <div className={styles.breadthInner}>
        <svg viewBox="0 0 100 100" width="120" height="120">
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#1a2236"
            strokeWidth="14"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#00e5a0"
            strokeWidth="14"
            strokeDasharray={`${advDash} ${circ - advDash}`}
            strokeDashoffset={circ * 0.25}
            strokeLinecap="round"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#ff5f5f"
            strokeWidth="14"
            strokeDasharray={`${decDash} ${circ - decDash}`}
            strokeDashoffset={circ * 0.25 - advDash}
            strokeLinecap="round"
          />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#3a4a6a"
            strokeWidth="14"
            strokeDasharray={`${unchDash} ${circ - unchDash}`}
            strokeDashoffset={circ * 0.25 - advDash - decDash}
            strokeLinecap="round"
          />
          <text
            x="50"
            y="46"
            textAnchor="middle"
            fill="#e8eaf6"
            fontSize="14"
            fontWeight="700"
          >
            {advances}
          </text>
          <text x="50" y="60" textAnchor="middle" fill="#8899bb" fontSize="8">
            ADV
          </text>
        </svg>
        <div className={styles.breadthLegend}>
          <div>
            <span className={styles.dot} style={{ background: "#00e5a0" }} />{" "}
            Advances <b>{advances}</b>
          </div>
          <div>
            <span className={styles.dot} style={{ background: "#ff5f5f" }} />{" "}
            Declines <b>{declines}</b>
          </div>
          <div>
            <span className={styles.dot} style={{ background: "#3a4a6a" }} />{" "}
            Unchanged <b>{unchanged}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon, color, note }) {
  return (
    <div className={styles.statCard} style={{ "--c": color }}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statBody}>
        <div className={styles.statLabel}>{label}</div>
        <div className={styles.statValue}>{value ?? "—"}</div>
        {sub && <div className={styles.statSub}>{sub}</div>}
        {note && <div className={styles.statNote}>{note}</div>}
      </div>
    </div>
  );
}

function FlowHistory({ history = [] }) {
  if (!history.length) return null;
  const vals = history.flatMap((h) => [h.fiiNet, h.diiNet]);
  const max = Math.max(...vals.map(Math.abs), 1);
  return (
    <div className={styles.flowHistoryCard}>
      <h3 className={styles.cardTitle}>FII / DII Flow — Last 10 Sessions</h3>
      <div className={styles.flowHistChart}>
        {[...history].reverse().map((h, i) => (
          <div key={i} className={styles.flowHistCol}>
            <div className={styles.flowHistBars}>
              <div
                className={styles.flowHistBar}
                style={{
                  height: `${(Math.abs(h.fiiNet) / max) * 80}px`,
                  background: h.fiiNet >= 0 ? "#00e5a0" : "#ff5f5f",
                  opacity: 0.9,
                }}
                title={`FII: ₹${h.fiiNet.toFixed(0)} Cr`}
              />
              <div
                className={styles.flowHistBar}
                style={{
                  height: `${(Math.abs(h.diiNet) / max) * 80}px`,
                  background: h.diiNet >= 0 ? "#4fa6ff" : "#ff9f43",
                  opacity: 0.9,
                }}
                title={`DII: ₹${h.diiNet.toFixed(0)} Cr`}
              />
            </div>
            <div className={styles.flowHistDate}>{h.date?.slice(0, 5)}</div>
          </div>
        ))}
      </div>
      <div className={styles.flowHistLegend}>
        <span>
          <span className={styles.dot} style={{ background: "#00e5a0" }} /> FII
          Inflow
        </span>
        <span>
          <span className={styles.dot} style={{ background: "#ff5f5f" }} /> FII
          Outflow
        </span>
        <span>
          <span className={styles.dot} style={{ background: "#4fa6ff" }} /> DII
          Inflow
        </span>
        <span>
          <span className={styles.dot} style={{ background: "#ff9f43" }} /> DII
          Outflow
        </span>
      </div>
    </div>
  );
}

const REFRESH_MS = 60_000;

export default function MarketDashboardPage() {
  const jwtToken = useStore((s) => s.jwtToken);
  const goToStep = useStore((s) => s.goToStep);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!jwtToken) {
      setError("Not logged in. Please login first.");
      setLoading(false);
      return;
    }
    try {
      const marketRes = await api.get("/dashboard/market");
      setData(marketRes.data.data);
      setLastRefresh(new Date());
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }, [jwtToken]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const indices = data?.indices || {};
  const charts = data?.charts || {};
  const fiiDii = data?.fiiDii || {};
  const usdInr = data?.usdInr || {};
  const gold = data?.gold || {};
  const volatility = data?.volatility || {};
  const repoRate = data?.repoRate || {};
  const breadth = data?.breadth || {};
  const macro = data?.macro || {};

  if (loading)
    return (
      <div className={styles.loadState}>
        <div className={styles.pulseRing} />
        <p>Fetching live market data…</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.errorState}>
        <span className={styles.errorIcon}>⚠</span>
        <p>{error}</p>
        <button onClick={fetchData} className={styles.retryBtn}>
          Retry
        </button>
        <button
          onClick={() => goToStep("dashboard")}
          className={styles.retryBtn}
        >
          ← Back to Dashboard
        </button>
      </div>
    );

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Market Dashboard</h1>
          <p className={styles.subtitle}>
            Live insights · Indian Equity Markets
          </p>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.liveChip}>
            <span className={styles.liveDot} />
            LIVE
          </div>
          <button onClick={fetchData} className={styles.refreshBtn}>
            ↻ Refresh
          </button>
          <button
            onClick={() => goToStep("dashboard")}
            className={styles.refreshBtn}
          >
            ← Back
          </button>
          {lastRefresh && (
            <span className={styles.lastRefresh}>
              Updated{" "}
              {lastRefresh.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Indices</h2>
        <div className={styles.indexGrid}>
          <IndexCard
            name="NIFTY 50"
            ltp={indices.nifty?.ltp}
            change={indices.nifty?.change}
            pChange={indices.nifty?.pChange}
            pe={indices.nifty?.niftyPE}
            pb={indices.nifty?.niftyPB}
            high={indices.nifty?.high}
            low={indices.nifty?.low}
            spark={charts.nifty}
            accent="#00e5a0"
          />
          <IndexCard
            name="SENSEX"
            ltp={indices.sensex?.ltp}
            change={indices.sensex?.change}
            pChange={indices.sensex?.pChange}
            pe={indices.sensex?.sensexPE}
            pb={indices.sensex?.sensexPB}
            high={indices.sensex?.high}
            low={indices.sensex?.low}
            spark={charts.sensex}
            accent="#4fa6ff"
          />
          <IndexCard
            name="BANK NIFTY"
            ltp={indices.bankNifty?.ltp}
            change={indices.bankNifty?.change}
            pChange={indices.bankNifty?.pChange}
            accent="#b48aff"
          />
          <IndexCard
            name="NIFTY MIDCAP"
            ltp={indices.niftyMidcap?.ltp}
            change={indices.niftyMidcap?.change}
            pChange={indices.niftyMidcap?.pChange}
            accent="#ffd166"
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Macro Indicators</h2>
        <div className={styles.statsGrid}>
          <StatCard
            icon="💱"
            label="USD / INR"
            color="#ffd166"
            value={usdInr.rate ? `₹ ${usdInr.rate}` : "—"}
            sub={
              usdInr.avg30d
                ? `30D avg ${usdInr.avg30d} · ${formatMacroDelta(
                    usdInr.vs30dAvgPct,
                  )}`
                : "Live forex rate"
            }
          />
          <StatCard
            icon="🪙"
            label="Gold (Est. INR / 10g)"
            color="#f59e0b"
            value={gold.price10gInr ? `₹ ${gold.price10gInr.toLocaleString("en-IN")}` : "—"}
            sub={
              gold.avg30d10gInr
                ? `30D avg ₹ ${gold.avg30d10gInr.toLocaleString("en-IN")} · ${formatMacroDelta(
                    gold.vs30dAvgPct,
                  )}`
                : "Derived from global gold futures"
            }
          />
          <StatCard
            icon="🌪️"
            label="India VIX"
            color="#ef4444"
            value={volatility.indiaVix?.ltp ?? "—"}
            sub={
              volatility.indiaVix?.avg30d
                ? `30D avg ${volatility.indiaVix.avg30d} · ${formatMacroDelta(
                    volatility.indiaVix.vs30dAvgPct,
                  )}`
                : "Volatility index"
            }
          />
          <StatCard
            icon="📊"
            label="Nifty P/E"
            color="#00e5a0"
            value={indices.nifty?.niftyPE ?? "—"}
            sub={`P/B: ${indices.nifty?.niftyPB ?? "—"} · DY: ${indices.nifty?.niftyDiv ?? "—"}%`}
          />
          <StatCard
            icon="📈"
            label="Nifty vs 30D Avg"
            color="#4fa6ff"
            value={
              indices.nifty?.avg30d
                ? `${formatMacroDelta(indices.nifty.vs30dAvgPct)}`
                : "—"
            }
            sub={
              indices.nifty?.avg30d
                ? `30D avg ${Number(indices.nifty.avg30d).toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}`
                : "Trend unavailable"
            }
          />
          <StatCard
            icon="🏦"
            label="RBI Repo Rate"
            color="#b48aff"
            value={repoRate.rate ? `${repoRate.rate}%` : "—"}
            sub={
              repoRate.lastUpdated
                ? `Updated ${repoRate.lastUpdated}`
                : `Source ${repoRate.source || "RBI"}`
            }
            note={repoRate.note}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Macro Regime</h2>
        <div className={styles.statsGrid}>
          <StatCard
            icon={macro.stance === "risk_on" ? "🟢" : macro.stance === "risk_off" ? "🔴" : "🟡"}
            label="Regime"
            color={
              macro.stance === "risk_on"
                ? "#22c55e"
                : macro.stance === "risk_off"
                ? "#ef4444"
                : "#ffd166"
            }
            value={formatRegimeLabel(macro.stance)}
            sub={Number.isFinite(macro.score) ? `Score ${macro.score}` : "Score unavailable"}
            note={macro.drivers?.slice(0, 2).join(" · ") || "Awaiting macro inputs"}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>
          FII &amp; DII Flows{" "}
          <span className={styles.sub}>{fiiDii.date || ""}</span>
        </h2>
        <div className={styles.flowGrid}>
          <FlowBar
            label="FII (Foreign Institutional)"
            buy={fiiDii.fii?.buyValue}
            sell={fiiDii.fii?.sellValue}
            net={fiiDii.fii?.netValue}
            color="#00e5a0"
          />
          <FlowBar
            label="DII (Domestic Institutional)"
            buy={fiiDii.dii?.buyValue}
            sell={fiiDii.dii?.sellValue}
            net={fiiDii.dii?.netValue}
            color="#4fa6ff"
          />
        </div>
        <FlowHistory history={fiiDii.history || []} />
        {fiiDii.unavailable && (
          <div className={styles.footer}>
            FII/DII feed unavailable from NSE at the moment. Other macro inputs are still live.
          </div>
        )}
      </section>

      <section className={styles.section}>
        <BreadthDonut
          advances={breadth.advances}
          declines={breadth.declines}
          unchanged={breadth.unchanged}
        />
      </section>

      <div className={styles.footer}>
        Data sourced from Angel One SmartAPI · NSE India · BSE India · RBI
        <br />
        Auto-refreshes every 60 seconds during market hours.
      </div>
    </div>
  );
}

function formatMacroDelta(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }
  const parsed = Number(value);
  return `${parsed >= 0 ? "+" : ""}${parsed.toFixed(2)}%`;
}

function formatRegimeLabel(value) {
  if (value === "risk_on") return "Risk On";
  if (value === "risk_off") return "Risk Off";
  return "Neutral";
}
