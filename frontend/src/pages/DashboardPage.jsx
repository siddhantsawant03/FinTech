import React, { useEffect, useState } from "react";
import { useStore } from "../store";
import AllocationPie from "../components/AllocationPie";
import StockCard from "../components/StockCard";
import MFCard from "../components/MFCard";
import ProjectionChart from "../components/ProjectionChart";
import MarketPulse from "../components/MarketPulse";
import RebalancingPanel from "../components/RebalancingPanel";
import WhatIfSimulator from "../components/WhatIfSimulator";
import RiskBadge from "../components/RiskBadge";
import styles from "./DashboardPage.module.css";

const TABS = [
  { id: "overview", label: "Overview", icon: "◎" },
  { id: "stocks", label: "Stocks", icon: "📈" },
  { id: "mf", label: "Mutual Funds", icon: "🏦" },
  { id: "projection", label: "Projection", icon: "📊" },
  { id: "rebalance", label: "Rebalancing", icon: "⚖️" },
  { id: "whatif", label: "What-If", icon: "🔮" },
];

export default function DashboardPage() {
  const {
    allocationResult,
    fetchMarketPulse,
    marketPulse,
    fetchLiveQuotes,
    goToStep,
    logout,
  } = useStore((s) => ({
    allocationResult: s.allocationResult,
    fetchMarketPulse: s.fetchMarketPulse,
    marketPulse: s.marketPulse,
    fetchLiveQuotes: s.fetchLiveQuotes,
    goToStep: s.goToStep,
    logout: s.logout,
  }));

  const [tab, setTab] = useState("overview");
  const [liveQuotes, setLiveQuotes] = useState({});

  useEffect(() => {
    fetchMarketPulse();
    const interval = setInterval(fetchMarketPulse, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch live quotes for recommended stocks
  useEffect(() => {
    const tokens = [];
    if (allocationResult?.stocks?.recommended) {
      const { large, mid, small } = allocationResult.stocks.recommended;
      [...large, ...mid, ...small].forEach((s) => {
        if (s.token) tokens.push(s.token);
      });
    }
    if (tokens.length > 0) {
      fetchLiveQuotes(tokens).then((quotes) => {
        const map = {};
        quotes.forEach((q) => {
          if (q.symbolToken) map[q.symbolToken] = q;
        });
        setLiveQuotes(map);
      });
      const interval = setInterval(() => {
        fetchLiveQuotes(tokens).then((quotes) => {
          const map = {};
          quotes.forEach((q) => {
            if (q.symbolToken) map[q.symbolToken] = q;
          });
          setLiveQuotes(map);
        });
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [allocationResult]);

  if (!allocationResult)
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );

  const {
    risk,
    allocation,
    equitySubAlloc,
    projections,
    marketSignals,
    stocks,
    mfRecommendations,
    rebalancingAlerts,
    sipAllocation,
    financialHealth,
    profile,
    debtSubAlloc,
  } = allocationResult;

  const allStocks = [
    ...(stocks?.recommended?.large || []),
    ...(stocks?.recommended?.mid || []),
    ...(stocks?.recommended?.small || []),
  ];
  const mfCategories = Object.entries(mfRecommendations || {});
  const aiSummary = stocks?.aiSummary;
  const userWeightProfile =
    stocks?.recommended?.summary?.userWeightProfile ||
    allStocks.find((stock) => stock.weights)?.weights ||
    null;
  const factorWeights = userWeightProfile
    ? Object.entries(userWeightProfile).sort(([, a], [, b]) => b - a)
    : [];
  const debtAllocation = Object.entries(debtSubAlloc || {}).filter(
    ([, value]) => value > 0,
  );

  return (
    <div className={styles.page}>
      {/* ── Top nav ── */}
      <nav className={styles.nav}>
        <div className={styles.navLeft}>
          <div className={styles.navLogo}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <polygon
                points="16,2 30,26 2,26"
                stroke="#d4af37"
                strokeWidth="1.5"
                fill="none"
              />
              <polygon points="16,8 25,24 7,24" fill="rgba(212,175,55,0.15)" />
            </svg>
            <span>WEALTH ALLOCATOR</span>
          </div>
          {marketPulse?.status && (
            <div
              className={`${styles.marketBadge} ${
                marketPulse.status.isOpen
                  ? styles.marketOpen
                  : styles.marketClosed
              }`}
            >
              <span className={styles.dot} />
              {marketPulse.status.isOpen ? "Market Open" : "Market Closed"}
            </div>
          )}
        </div>

        <div className={styles.navRight}>
          <button className={styles.navBtn} onClick={() => goToStep("profile")}>
            ← Edit Profile
          </button>
          <button className={styles.navBtn} onClick={() => goToStep("market")}>
            📊 Market Pulse
          </button>
          <button className={styles.navBtn} onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      {/* ── Risk & Signal bar ── */}
      <div className={styles.signalBar}>
        <RiskBadge
          bucket={risk.bucket}
          label={risk.bucketLabel}
          score={risk.score}
        />
        {marketSignals.map((s, i) => (
          <div
            key={i}
            className={`${styles.signal} ${styles[`signal_${s.type}`]}`}
          >
            <span>
              {s.type === "warning"
                ? "⚠️"
                : s.type === "bullish"
                ? "📈"
                : s.type === "opportunity"
                ? "💡"
                : "◎"}
            </span>
            {s.message}
          </div>
        ))}
        {risk.overridesApplied?.length > 0 && (
          <div className={styles.overrides}>
            {risk.overridesApplied.map((o, i) => (
              <span key={i} className={styles.override}>
                {o}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className={styles.tabBar}>
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`${styles.tab} ${tab === t.id ? styles.tabActive : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span>{t.icon}</span> {t.label}
            {t.id === "rebalance" && rebalancingAlerts?.length > 0 && (
              <span className={styles.badge}>{rebalancingAlerts.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className={styles.content}>
        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div className={styles.overview}>
            <div className={styles.overviewLeft}>
              <AllocationPie
                allocation={allocation}
                equitySubAlloc={equitySubAlloc}
              />

              {/* Allocation breakdown */}
              <div className={styles.allocBreakdown}>
                <h3 className={styles.sectionTitle}>Asset Allocation</h3>
                {[
                  {
                    key: "equity",
                    label: "Equity",
                    color: "#d4af37",
                    sub: [
                      `${equitySubAlloc.large}% Large`,
                      `${equitySubAlloc.mid}% Mid`,
                      `${equitySubAlloc.small}% Small`,
                      equitySubAlloc.intl ? `${equitySubAlloc.intl}% Intl` : null,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                  },
                  {
                    key: "debt",
                    label: "Debt",
                    color: "#3b82f6",
                    sub: `Duration matched to ${profile.timeHorizon}yr horizon`,
                  },
                  {
                    key: "gold",
                    label: "Gold",
                    color: "#f59e0b",
                    sub: "Via Gold ETF / Gold MF",
                  },
                  {
                    key: "cash",
                    label: "Cash",
                    color: "#22c55e",
                    sub: "Liquid fund / overnight fund",
                  },
                ].map((a) => (
                  <div key={a.key} className={styles.allocRow}>
                    <div className={styles.allocBar}>
                      <div
                        className={styles.allocFill}
                        style={{
                          width: `${allocation[a.key]}%`,
                          background: a.color,
                        }}
                      />
                    </div>
                    <div className={styles.allocInfo}>
                      <div
                        className={styles.allocLabel}
                        style={{ color: a.color }}
                      >
                        {a.label}
                      </div>
                      <div className={styles.allocPct}>
                        {allocation[a.key]}%
                      </div>
                    </div>
                    <div className={styles.allocSub}>{a.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.overviewRight}>
              {/* Financial health */}
              <div className={styles.healthCard}>
                <h3 className={styles.cardTitle}>Financial Health</h3>
                <div className={styles.healthScore}>
                  <div className={styles.healthNum}>
                    {financialHealth.healthScore}
                  </div>
                  <div className={styles.healthLabel}>/100</div>
                </div>
                <div className={styles.healthMetrics}>
                  <HealthMetric
                    label="Net Surplus"
                    value={`₹${financialHealth.netSurplus?.toLocaleString(
                      "en-IN",
                    )}/mo`}
                    ok={financialHealth.netSurplus > 0}
                  />
                  <HealthMetric
                    label="Debt-to-Income"
                    value={`${(financialHealth.debtToIncome * 100).toFixed(
                      0,
                    )}%`}
                    ok={financialHealth.debtToIncome < 0.3}
                  />
                  <HealthMetric
                    label="Savings Rate"
                    value={`${(financialHealth.savingsRate * 100).toFixed(0)}%`}
                    ok={financialHealth.savingsRate > 0.2}
                  />
                  <HealthMetric
                    label="Emergency Fund"
                    value={financialHealth.emergencyFundStatus}
                    ok={financialHealth.emergencyFundStatus === "adequate"}
                  />
                </div>
              </div>

              <div className={styles.logicCard}>
                <h3 className={styles.cardTitle}>Decision Engine</h3>
                <p className={styles.logicIntro}>
                  The backend adjusts your recommendations using the quiz,
                  debt load, goal, horizon, and income stability before any
                  stock is ranked.
                </p>
                <div className={styles.logicStats}>
                  <LogicStat
                    label="Risk Score"
                    value={`${risk.score}/100`}
                    tone="gold"
                  />
                  <LogicStat
                    label="Quiz Score"
                    value={`${risk.psychometricScore}/100`}
                    tone="blue"
                  />
                  <LogicStat
                    label="Avg AI Score"
                    value={
                      aiSummary?.avgAIScore
                        ? `${aiSummary.avgAIScore}/100`
                        : "—"
                    }
                    tone="green"
                  />
                  <LogicStat
                    label="Stocks Ranked"
                    value={aiSummary?.totalRecommended ?? allStocks.length}
                    tone="muted"
                  />
                </div>

                {factorWeights.length > 0 && (
                  <div className={styles.weightSection}>
                    <div className={styles.weightTitle}>
                      Personalised AI factor weights
                    </div>
                    <div className={styles.weightList}>
                      {factorWeights.map(([factor, value]) => (
                        <WeightBar
                          key={factor}
                          label={formatFactorLabel(factor)}
                          value={value}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className={styles.debtCard}>
                <h3 className={styles.cardTitle}>Debt Sleeve Logic</h3>
                {allocation.debt > 0 ? (
                  <>
                    <p className={styles.logicIntro}>
                      Your {allocation.debt}% debt allocation is split by the{" "}
                      {profile.timeHorizon}-year horizon rather than evenly
                      across categories.
                    </p>
                    <div className={styles.weightList}>
                      {debtAllocation.map(([key, value]) => (
                        <SplitBar
                          key={key}
                          label={formatDebtLabel(key)}
                          value={value}
                          color="#3b82f6"
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className={styles.emptyLogic}>
                    No debt sleeve was allocated for this profile.
                  </div>
                )}
              </div>

              {/* Quick projection */}
              <div className={styles.projCard}>
                <h3 className={styles.cardTitle}>
                  Projected Corpus ({profile.timeHorizon}yr)
                </h3>
                <div className={styles.projScenarios}>
                  {["conservative", "base", "optimistic"].map((s) => (
                    <div key={s} className={styles.projScenario}>
                      <div className={styles.projLabel}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </div>
                      <div
                        className={`${styles.projValue} ${
                          s === "base" ? styles.projBase : ""
                        }`}
                      >
                        ₹{formatCrore(projections[s]?.futureValue)}
                      </div>
                      <div className={styles.projCAGR}>
                        {projections[s]?.blendedCAGR}% CAGR
                      </div>
                    </div>
                  ))}
                </div>
                <div className={styles.projInvested}>
                  Total invested: ₹
                  {formatCrore(projections.base?.totalInvested)} → Wealth gain:
                  ₹{formatCrore(projections.base?.wealthGain)}
                </div>
              </div>

              {/* SIP breakdown */}
              <div className={styles.sipCard}>
                <h3 className={styles.cardTitle}>Monthly SIP Allocation</h3>
                <div className={styles.sipTotal}>
                  ₹{sipAllocation?.total?.toLocaleString("en-IN")} / month
                </div>
                <div className={styles.sipBreakdown}>
                  {[
                    {
                      label: "Equity MFs",
                      ...sipAllocation?.equity,
                      color: "#d4af37",
                    },
                    {
                      label: "Debt MFs",
                      ...sipAllocation?.debt,
                      color: "#3b82f6",
                    },
                    {
                      label: "Gold MF",
                      ...sipAllocation?.gold,
                      color: "#f59e0b",
                    },
                  ]
                    .filter((s) => s.total > 0)
                    .map((s) => (
                      <div key={s.label} className={styles.sipRow}>
                        <div
                          className={styles.sipDot}
                          style={{ background: s.color }}
                        />
                        <div className={styles.sipLabel}>{s.label}</div>
                        <div className={styles.sipAmt}>
                          ₹{s.total?.toLocaleString("en-IN")}
                        </div>
                        {s.perFund > 0 && (
                          <div className={styles.sipPer}>
                            ₹{s.perFund?.toLocaleString("en-IN")}/fund
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>

              {/* Market pulse */}
              {marketPulse && <MarketPulse pulse={marketPulse} />}
            </div>
          </div>
        )}

        {/* ── STOCKS ── */}
        {tab === "stocks" && (
          <div className={styles.stocksTab}>
            {!stocks.eligible ? (
              <div className={styles.notEligible}>
                <div className={styles.notEligibleIcon}>📊</div>
                <h3>Corpus below ₹5 Lakhs</h3>
                <p>
                  Direct stock recommendations are available when your
                  investable corpus (lumpsum) is ₹5 lakh or more. For now,
                  mutual funds are your best entry point.
                </p>
                <button
                  className={styles.switchTabBtn}
                  onClick={() => setTab("mf")}
                >
                  View MF Recommendations →
                </button>
              </div>
            ) : (
              <>
                <div className={styles.stocksHeader}>
                  <div>
                    <h2 className={styles.tabTitle}>Stock Recommendations</h2>
                    <p className={styles.tabSub}>
                      {allStocks.length} stocks screened from NSE 500 · Live
                      prices via SmartAPI
                    </p>
                  </div>
                  <div className={styles.capLegend}>
                    <span
                      className={styles.capDot}
                      style={{ background: "#d4af37" }}
                    />{" "}
                    Large cap ({stocks.recommended?.large?.length || 0})
                    <span
                      className={styles.capDot}
                      style={{ background: "#3b82f6" }}
                    />{" "}
                    Mid cap ({stocks.recommended?.mid?.length || 0})
                    <span
                      className={styles.capDot}
                      style={{ background: "#22c55e" }}
                    />{" "}
                    Small cap ({stocks.recommended?.small?.length || 0})
                  </div>
                </div>

                <div className={styles.aiSummaryCard}>
                  <div className={styles.aiSummaryTop}>
                    <div className={styles.aiSummaryBlock}>
                      <span className={styles.aiSummaryLabel}>
                        Strong Buys
                      </span>
                      <strong className={styles.aiSummaryValue}>
                        {aiSummary?.strongBuys ?? 0}
                      </strong>
                    </div>
                    <div className={styles.aiSummaryBlock}>
                      <span className={styles.aiSummaryLabel}>Buys</span>
                      <strong className={styles.aiSummaryValue}>
                        {aiSummary?.buys ?? 0}
                      </strong>
                    </div>
                    <div className={styles.aiSummaryBlock}>
                      <span className={styles.aiSummaryLabel}>
                        Avg AI Score
                      </span>
                      <strong className={styles.aiSummaryValue}>
                        {aiSummary?.avgAIScore ?? "—"}
                      </strong>
                    </div>
                    <div className={styles.aiSummaryBlock}>
                      <span className={styles.aiSummaryLabel}>
                        Equity Corpus
                      </span>
                      <strong className={styles.aiSummaryValue}>
                        ₹{formatCrore(aiSummary?.equityCorpusAllocated)}
                      </strong>
                    </div>
                  </div>

                  <p className={styles.aiSummaryText}>
                    Stocks are filtered, scored, then capital is
                    conviction-weighted from the engine output instead of being
                    displayed as generic picks.
                  </p>

                  {factorWeights.length > 0 && (
                    <div className={styles.weightList}>
                      {factorWeights.map(([factor, value]) => (
                        <WeightBar
                          key={`stocks-${factor}`}
                          label={formatFactorLabel(factor)}
                          value={value}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {["large", "mid", "small"].map((cap) => {
                  const list = stocks.recommended?.[cap] || [];
                  if (list.length === 0) return null;
                  const capColor =
                    cap === "large"
                      ? "#d4af37"
                      : cap === "mid"
                      ? "#3b82f6"
                      : "#22c55e";
                  const pct = equitySubAlloc[cap];
                  return (
                    <div key={cap} className={styles.capGroup}>
                      <div className={styles.capGroupHeader}>
                        <span
                          className={styles.capGroupDot}
                          style={{ background: capColor }}
                        />
                        <h3 className={styles.capGroupTitle}>
                          {cap.charAt(0).toUpperCase() + cap.slice(1)} Cap
                        </h3>
                        <span className={styles.capGroupPct}>
                          {pct}% of equity
                        </span>
                      </div>
                      <div className={styles.stockGrid}>
                        {list.map((s) => (
                          <StockCard
                            key={s.symbol}
                            stock={s}
                            liveQuote={liveQuotes[s.token]}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className={styles.disclaimer}>
                  ⚠️ These are algorithmic recommendations based on screening
                  rules — not buy calls or investment advice. Prices shown are
                  live/delayed from Angel One SmartAPI. Not SEBI-registered
                  advice.
                </div>
              </>
            )}
          </div>
        )}

        {/* ── MF ── */}
        {tab === "mf" && (
          <div className={styles.mfTab}>
            <div className={styles.mfHeader}>
              <h2 className={styles.tabTitle}>Mutual Fund Recommendations</h2>
              <p className={styles.tabSub}>
                NAV data from AMFI · Categorised for your risk profile
              </p>
            </div>
            {mfCategories.map(([cat, funds]) => (
              <div key={cat} className={styles.mfGroup}>
                <h3 className={styles.mfGroupTitle}>{formatCatName(cat)}</h3>
                <div className={styles.mfGrid}>
                  {funds.map((fund, i) => (
                    <MFCard
                      key={i}
                      fund={fund}
                      sipAmount={getSIPForCategory(cat, sipAllocation)}
                    />
                  ))}
                </div>
              </div>
            ))}
            <div className={styles.disclaimer}>
              ⚠️ For educational purposes only. Verify fund details on AMFI /
              fund house websites before investing. Past returns do not
              guarantee future performance.
            </div>
          </div>
        )}

        {/* ── PROJECTION ── */}
        {tab === "projection" && (
          <ProjectionChart
            projections={projections}
            profile={profile}
            sipAllocation={sipAllocation}
          />
        )}

        {/* ── REBALANCING ── */}
        {tab === "rebalance" && (
          <RebalancingPanel alerts={rebalancingAlerts} target={allocation} />
        )}

        {/* ── WHAT IF ── */}
        {tab === "whatif" && (
          <WhatIfSimulator
            allocation={allocation}
            profile={profile}
            projections={projections}
          />
        )}
      </div>
    </div>
  );
}

function LogicStat({ label, value, tone = "muted" }) {
  return (
    <div className={styles.logicStat}>
      <span className={styles.logicStatLabel}>{label}</span>
      <strong className={`${styles.logicStatValue} ${styles[`tone_${tone}`]}`}>
        {value}
      </strong>
    </div>
  );
}

function WeightBar({ label, value }) {
  return (
    <div className={styles.weightRow}>
      <div className={styles.weightMeta}>
        <span className={styles.weightLabel}>{label}</span>
        <span className={styles.weightValue}>
          {(value * 100).toFixed(1)}%
        </span>
      </div>
      <div className={styles.weightTrack}>
        <div
          className={styles.weightFill}
          style={{ width: `${Math.max(value * 100, 4)}%` }}
        />
      </div>
    </div>
  );
}

function SplitBar({ label, value, color }) {
  return (
    <div className={styles.weightRow}>
      <div className={styles.weightMeta}>
        <span className={styles.weightLabel}>{label}</span>
        <span className={styles.weightValue}>{value}%</span>
      </div>
      <div className={styles.weightTrack}>
        <div
          className={styles.weightFill}
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

function HealthMetric({ label, value, ok }) {
  return (
    <div className={styles.healthMetric}>
      <span className={styles.hmLabel}>{label}</span>
      <span className={`${styles.hmValue} ${ok ? styles.hmOk : styles.hmBad}`}>
        {value}
      </span>
    </div>
  );
}

function formatCrore(val) {
  if (!val) return "—";
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)}Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(1)}L`;
  return val.toLocaleString("en-IN");
}

function formatFactorLabel(factor) {
  const labels = {
    value: "Value",
    quality: "Quality",
    growth: "Growth",
    momentum: "Momentum",
    income: "Income",
    riskFit: "Risk Fit",
  };
  return labels[factor] || factor;
}

function formatDebtLabel(key) {
  const labels = {
    liquid: "Liquid Funds",
    shortDuration: "Short Duration",
    corporateBond: "Corporate Bond",
    dynamicBond: "Dynamic Bond",
  };
  return labels[key] || key;
}

function formatCatName(cat) {
  const names = {
    large_cap_index: "Large Cap Index Fund",
    flexi_cap: "Flexi Cap Fund",
    mid_cap: "Mid Cap Fund",
    small_cap: "Small Cap Fund",
    large_mid_cap: "Large & Mid Cap Fund",
    balanced_advantage: "Balanced Advantage Fund",
    multi_asset: "Multi-Asset Allocation Fund",
    liquid: "Liquid Fund",
    short_duration: "Short Duration Fund",
    dynamic_bond: "Dynamic Bond Fund",
    banking_psu: "Banking & PSU Debt Fund",
    gold_etf: "Gold Fund",
  };
  return names[cat] || cat;
}

function getSIPForCategory(cat, sipAlloc) {
  const equity = [
    "large_cap_index",
    "flexi_cap",
    "mid_cap",
    "small_cap",
    "balanced_advantage",
    "multi_asset",
    "large_mid_cap",
  ];
  const debt = ["liquid", "short_duration", "dynamic_bond", "banking_psu"];
  if (equity.includes(cat)) return sipAlloc?.equity?.perFund;
  if (debt.includes(cat)) return sipAlloc?.debt?.perFund;
  if (cat === "gold_etf") return sipAlloc?.gold?.total;
  return null;
}
