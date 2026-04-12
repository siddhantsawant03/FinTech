const express = require('express');
const router = express.Router();
const smartapi = require('../services/smartapi');
const amfiService = require('../services/amfi');
const {
  calculateRiskScore,
  getRiskBucket,
  BASE_ALLOCATION,
  applyGoalOverlay,
  applyTacticalOverlay,
  EQUITY_SUB_ALLOCATION,
  screenStocks,
  getDebtSubAllocation,
  selectMFCategories,
  projectPortfolio,
  checkRebalancingNeeded,
  scorePsychometric,
  PSYCHOMETRIC_QUESTIONS,
  STOCK_UNIVERSE
} = require('../engine/allocator');

// GET /api/allocation/questions — return psychometric questions
router.get('/questions', (req, res) => {
  res.json(PSYCHOMETRIC_QUESTIONS);
});

// POST /api/allocation/run — main allocation engine
router.post('/run', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const {
      // User profile
      age,
      monthlyIncome,
      monthlyExpenses,
      monthlyEMI,
      monthlySIP,
      lumpsumAmount,
      goal, // 'retirement' | 'child_education' | 'home_purchase' | 'wealth_creation' | 'emergency_corpus'
      timeHorizon,
      incomeStability,
      emergencyFundMonths,
      psychometricAnswers,
      // From SmartAPI (passed from frontend after auto-fetch)
      existingHoldings,
      recentOrders
    } = req.body;

    // ── 1. Compute financial health
    const monthlyLiabilities = (monthlyExpenses || 0) + (monthlyEMI || 0);
    const netSurplus = monthlyIncome - monthlyLiabilities;
    const debtToIncome = monthlyEMI / monthlyIncome;
    const investableCorpus = (lumpsumAmount || 0) + (monthlySIP * timeHorizon * 12 || 0);

    const financialHealth = {
      netSurplus,
      debtToIncome: parseFloat(debtToIncome.toFixed(2)),
      savingsRate: parseFloat((netSurplus / monthlyIncome).toFixed(2)),
      emergencyFundStatus: emergencyFundMonths >= 6 ? 'adequate' : emergencyFundMonths >= 3 ? 'partial' : 'insufficient',
      healthScore: computeHealthScore(debtToIncome, netSurplus, monthlyIncome, emergencyFundMonths)
    };

    // ── 2. Risk scoring
    const psychometricScore = scorePsychometric(psychometricAnswers);
    const riskScore = calculateRiskScore({
      age,
      timeHorizon,
      incomeStability,
      debtToIncome,
      psychometricScore,
      emergencyFundMonths
    });
    const riskBucket = getRiskBucket(riskScore, { age, emergencyFundMonths, debtToIncome, timeHorizon });

    // ── 3. Base SAA
    let allocation = { ...BASE_ALLOCATION[riskBucket] };

    // ── 4. Goal overlay
    allocation = applyGoalOverlay(allocation, goal, timeHorizon);

    // ── 5. Tactical overlay (fetch indices if token available)
    let marketSignals = [];
    let niftyData = null;
    if (token) {
      try {
        const indices = await smartapi.getIndices(token);
        niftyData = parseIndices(indices);
      } catch (e) {}
    }
    const tacticalResult = applyTacticalOverlay(allocation, niftyData);
    allocation = tacticalResult.allocation;
    marketSignals = tacticalResult.signals;

    // ── 6. Equity sub-allocation
    const equitySubAlloc = EQUITY_SUB_ALLOCATION[riskBucket];

    // ── 7. Stock screening (with SmartAPI data if available)
    const stocksWithData = await enrichStocksWithSmartAPI(token, riskBucket);
    const existingSymbols = (existingHoldings || []).map(h => h.tradingsymbol);
    const recentSellSymbols = (recentOrders || [])
      .filter(o => o.transactiontype === 'SELL')
      .map(o => o.tradingsymbol);

    const screened = screenStocks(stocksWithData, riskBucket,
      existingHoldings?.map(h => ({ tradingsymbol: h.tradingsymbol })) || [],
      recentOrders?.filter(o => o.transactiontype === 'SELL') || []
    );

    // ── 8. Debt sub-allocation
    const debtSubAlloc = getDebtSubAllocation(timeHorizon);

    // ── 9. MF category selection
    const mfCategories = selectMFCategories(riskBucket, allocation, timeHorizon, lumpsumAmount || 0);
    const mfRecommendations = await amfiService.getRecommendations(mfCategories);

    // ── 10. Portfolio projection
    const projections = projectPortfolio(
      lumpsumAmount || 0,
      monthlySIP || 0,
      timeHorizon,
      allocation
    );

    // ── 11. Rebalancing check
    let rebalancingAlerts = [];
    if (existingHoldings && existingHoldings.length > 0) {
      const currentAlloc = computeCurrentAllocation(existingHoldings);
      rebalancingAlerts = checkRebalancingNeeded(currentAlloc, allocation);
    }

    // ── Response
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      profile: {
        age, goal, timeHorizon, incomeStability, monthlySIP, lumpsumAmount
      },
      financialHealth,
      risk: {
        score: riskScore,
        psychometricScore,
        bucket: riskBucket,
        bucketLabel: BUCKET_LABELS[riskBucket],
        overridesApplied: getOverrides(age, emergencyFundMonths, debtToIncome, timeHorizon)
      },
      allocation,
      equitySubAlloc,
      debtSubAlloc,
      marketSignals,
      niftyData,
      stocks: {
        eligible: lumpsumAmount >= 500000,
        recommended: screened,
        existingHeld: existingSymbols
      },
      mfRecommendations,
      projections,
      rebalancingAlerts,
      sipAllocation: computeSIPAllocation(allocation, monthlySIP || 0, mfCategories)
    });

  } catch (err) {
    console.error('Allocation engine error:', err);
    res.status(500).json({ error: 'Allocation failed', message: err.message });
  }
});

// POST /api/allocation/whatif — simulation
router.post('/whatif', (req, res) => {
  const { baseSIP, extraSIP, timeHorizon, allocation, scenario } = req.body;
  const result = projectPortfolio(0, baseSIP + (extraSIP || 0), timeHorizon, allocation);
  const base = projectPortfolio(0, baseSIP, timeHorizon, allocation);
  res.json({
    base: base.base,
    withChange: result.base,
    difference: result.base.futureValue - base.base.futureValue
  });
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const BUCKET_LABELS = {
  conservative: 'Conservative',
  mod_conservative: 'Moderate Conservative',
  mod_aggressive: 'Moderate Aggressive',
  aggressive: 'Aggressive',
  very_aggressive: 'Very Aggressive'
};

function computeHealthScore(dti, surplus, income, emergency) {
  let score = 100;
  if (dti > 0.5) score -= 40;
  else if (dti > 0.4) score -= 25;
  else if (dti > 0.3) score -= 10;
  if (surplus < 0) score -= 30;
  else if (surplus < income * 0.1) score -= 15;
  if (emergency < 1) score -= 20;
  else if (emergency < 3) score -= 10;
  return Math.max(0, score);
}

function getOverrides(age, emergency, dti, horizon) {
  const overrides = [];
  if (age > 55) overrides.push('Age > 55 — capped at Moderate Conservative');
  if (emergency < 1) overrides.push('No emergency fund — downgraded one bucket');
  if (dti > 0.4) overrides.push('High debt burden — downgraded one bucket');
  if (horizon < 3) overrides.push('Short horizon < 3yrs — capped at Moderate Conservative');
  return overrides;
}

async function enrichStocksWithSmartAPI(token, bucket) {
  // Return base universe - in prod, fetch live fundamentals
  // Token map is expensive, return base data
  const { STOCK_UNIVERSE } = require('../engine/allocator');
  return {
    large_cap: STOCK_UNIVERSE.large_cap.map(s => ({
      ...s,
      fundamentals: getMockFundamentals(s.symbol),
      avgVolumeCr: 50 // placeholder
    })),
    mid_cap: STOCK_UNIVERSE.mid_cap.map(s => ({
      ...s,
      fundamentals: getMockFundamentals(s.symbol),
      avgVolumeCr: 15
    })),
    small_cap: STOCK_UNIVERSE.small_cap.map(s => ({
      ...s,
      fundamentals: getMockFundamentals(s.symbol),
      avgVolumeCr: 6
    }))
  };
}

function getMockFundamentals(symbol) {
  // In production: fetch from SmartAPI getFundamentals
  // Returning reasonable defaults for now
  return { debtToEquity: 0.5, eps: 50, pe: 20, dividendYield: 1.5 };
}

function parseIndices(indices) {
  if (!indices || indices.length === 0) return null;
  // Mock P/E since SmartAPI quote doesn't directly return P/E for indices
  // In prod, scrape NSE or use a PE data service
  return { niftyPE: 22.5, niftyDrawdown: -3.2 };
}

function computeCurrentAllocation(holdings) {
  const total = holdings.reduce((sum, h) => sum + (h.ltp * h.quantity), 0);
  if (total === 0) return {};
  // Simplified: assume all holdings are equity for now
  return { equity: 100, debt: 0, gold: 0, cash: 0 };
}

function computeSIPAllocation(allocation, totalSIP, categories) {
  const equityMFs = categories.filter(c =>
    ['large_cap_index', 'flexi_cap', 'mid_cap', 'small_cap', 'balanced_advantage', 'multi_asset', 'large_mid_cap'].includes(c)
  );
  const debtMFs = categories.filter(c =>
    ['liquid', 'short_duration', 'dynamic_bond', 'banking_psu'].includes(c)
  );
  const goldMFs = categories.filter(c => c === 'gold_etf');

  const equitySIP = Math.round((totalSIP * allocation.equity) / 100);
  const debtSIP = Math.round((totalSIP * allocation.debt) / 100);
  const goldSIP = Math.round((totalSIP * allocation.gold) / 100);
  const cashSIP = totalSIP - equitySIP - debtSIP - goldSIP;

  const perFundEquity = equityMFs.length > 0 ? Math.round(equitySIP / equityMFs.length) : 0;
  const perFundDebt = debtMFs.length > 0 ? Math.round(debtSIP / debtMFs.length) : 0;

  return {
    total: totalSIP,
    equity: { total: equitySIP, perFund: perFundEquity, funds: equityMFs.length },
    debt: { total: debtSIP, perFund: perFundDebt, funds: debtMFs.length },
    gold: { total: goldSIP },
    cash: { total: cashSIP }
  };
}

module.exports = router;
