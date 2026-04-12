/**
 * WEALTH ALLOCATOR — CORE ENGINE
 * All allocation rules, risk scoring, and stock screening logic
 */

// ─── STOCK UNIVERSE (NSE 500 curated subset with tokens) ─────────────────────
// In production, load this from a JSON file. Token = Angel One symbol token.
const STOCK_UNIVERSE = {
  large_cap: [
    { symbol: 'RELIANCE', token: '2885', sector: 'Energy', name: 'Reliance Industries' },
    { symbol: 'TCS', token: '11536', sector: 'IT', name: 'Tata Consultancy Services' },
    { symbol: 'HDFCBANK', token: '1333', sector: 'Banking', name: 'HDFC Bank' },
    { symbol: 'INFY', token: '1594', sector: 'IT', name: 'Infosys' },
    { symbol: 'ICICIBANK', token: '4963', sector: 'Banking', name: 'ICICI Bank' },
    { symbol: 'HINDUNILVR', token: '1394', sector: 'FMCG', name: 'Hindustan Unilever' },
    { symbol: 'SBIN', token: '3045', sector: 'Banking', name: 'State Bank of India' },
    { symbol: 'BHARTIARTL', token: '10604', sector: 'Telecom', name: 'Bharti Airtel' },
    { symbol: 'KOTAKBANK', token: '1922', sector: 'Banking', name: 'Kotak Mahindra Bank' },
    { symbol: 'LT', token: '11483', sector: 'Infrastructure', name: 'Larsen & Toubro' },
    { symbol: 'ASIANPAINT', token: '236', sector: 'Paints', name: 'Asian Paints' },
    { symbol: 'AXISBANK', token: '5900', sector: 'Banking', name: 'Axis Bank' },
    { symbol: 'MARUTI', token: '10999', sector: 'Auto', name: 'Maruti Suzuki' },
    { symbol: 'TITAN', token: '3506', sector: 'Consumer', name: 'Titan Company' },
    { symbol: 'SUNPHARMA', token: '3351', sector: 'Pharma', name: 'Sun Pharmaceutical' },
    { symbol: 'ULTRACEMCO', token: '11532', sector: 'Cement', name: 'UltraTech Cement' },
    { symbol: 'WIPRO', token: '3787', sector: 'IT', name: 'Wipro' },
    { symbol: 'ONGC', token: '2475', sector: 'Energy', name: 'ONGC' },
    { symbol: 'NTPC', token: '11630', sector: 'Power', name: 'NTPC' },
    { symbol: 'POWERGRID', token: '14977', sector: 'Power', name: 'Power Grid Corporation' }
  ],
  mid_cap: [
    { symbol: 'PERSISTENT', token: '18365', sector: 'IT', name: 'Persistent Systems' },
    { symbol: 'DIXON', token: '17854', sector: 'Electronics', name: 'Dixon Technologies' },
    { symbol: 'ASTRAL', token: '14418', sector: 'Pipes', name: 'Astral Ltd' },
    { symbol: 'COFORGE', token: '17488', sector: 'IT', name: 'Coforge' },
    { symbol: 'CROMPTON', token: '17094', sector: 'Consumer', name: 'Crompton Greaves' },
    { symbol: 'VOLTAS', token: '3718', sector: 'Consumer', name: 'Voltas' },
    { symbol: 'PAGEIND', token: '14413', sector: 'Consumer', name: 'Page Industries' },
    { symbol: 'SUPREMEIND', token: '3442', sector: 'Plastics', name: 'Supreme Industries' },
    { symbol: 'AAVAS', token: '19089', sector: 'Finance', name: 'Aavas Financiers' },
    { symbol: 'KANSAINER', token: '19234', sector: 'Paints', name: 'Kansai Nerolac' }
  ],
  small_cap: [
    { symbol: 'ELECON', token: '1790', sector: 'Engineering', name: 'Elecon Engineering' },
    { symbol: 'GAEL', token: '1251', sector: 'FMCG', name: 'Gujarat Ambuja Exports' },
    { symbol: 'ORIENTELEC', token: '14767', sector: 'Consumer', name: 'Orient Electric' },
    { symbol: 'GALAXYSURF', token: '1417', sector: 'Chemicals', name: 'Galaxy Surfactants' },
    { symbol: 'BALRAMCHIN', token: '500', sector: 'Sugar', name: 'Balrampur Chini Mills' },
    { symbol: 'JINDALSAW', token: '1669', sector: 'Steel', name: 'Jindal SAW' },
    { symbol: 'NIITLTD', token: '2160', sector: 'IT Services', name: 'NIIT Ltd' },
    { symbol: 'KITEX', token: '14939', sector: 'Textiles', name: 'Kitex Garments' }
  ]
};

// ─── LAYER 1: RISK SCORING ────────────────────────────────────────────────────

function calculateRiskScore(profile) {
  const {
    age,
    timeHorizon, // years
    incomeStability, // 'salaried' | 'business' | 'freelance'
    debtToIncome, // ratio 0-1
    psychometricScore, // 0-100 from quiz
    emergencyFundMonths // months of expenses saved
  } = profile;

  let score = 0;

  // Age score (25%)
  const ageScore = age < 25 ? 100 : age < 35 ? 85 : age < 45 ? 65 : age < 55 ? 40 : 20;
  score += ageScore * 0.25;

  // Time horizon (20%)
  const horizonScore = timeHorizon >= 15 ? 100 : timeHorizon >= 10 ? 80 : timeHorizon >= 7 ? 65 : timeHorizon >= 5 ? 50 : timeHorizon >= 3 ? 30 : 10;
  score += horizonScore * 0.20;

  // Income stability (15%)
  const stabilityScore = incomeStability === 'salaried' ? 80 : incomeStability === 'business' ? 50 : 40;
  score += stabilityScore * 0.15;

  // Liabilities (10%)
  const liabilityScore = debtToIncome < 0.1 ? 100 : debtToIncome < 0.2 ? 80 : debtToIncome < 0.3 ? 60 : debtToIncome < 0.4 ? 40 : 10;
  score += liabilityScore * 0.10;

  // Psychometric quiz (20%)
  score += (psychometricScore || 50) * 0.20;

  // Emergency fund (10%)
  const emergencyScore = emergencyFundMonths >= 6 ? 100 : emergencyFundMonths >= 3 ? 60 : emergencyFundMonths >= 1 ? 30 : 0;
  score += emergencyScore * 0.10;

  return Math.round(score);
}

function getRiskBucket(score, profile) {
  let bucket;
  if (score <= 30) bucket = 'conservative';
  else if (score <= 55) bucket = 'mod_conservative';
  else if (score <= 70) bucket = 'mod_aggressive';
  else if (score <= 85) bucket = 'aggressive';
  else bucket = 'very_aggressive';

  // Hard overrides
  if (profile.age > 55) bucket = capBucket(bucket, 'mod_conservative');
  if (profile.emergencyFundMonths < 1) bucket = downgradeBucket(bucket);
  if (profile.debtToIncome > 0.40) bucket = downgradeBucket(bucket);
  if (profile.timeHorizon < 3) bucket = capBucket(bucket, 'mod_conservative');

  return bucket;
}

const BUCKET_ORDER = ['conservative', 'mod_conservative', 'mod_aggressive', 'aggressive', 'very_aggressive'];

function capBucket(current, cap) {
  const cIdx = BUCKET_ORDER.indexOf(current);
  const capIdx = BUCKET_ORDER.indexOf(cap);
  return cIdx > capIdx ? cap : current;
}

function downgradeBucket(current) {
  const idx = BUCKET_ORDER.indexOf(current);
  return idx > 0 ? BUCKET_ORDER[idx - 1] : current;
}

// ─── LAYER 2A: STRATEGIC ASSET ALLOCATION ────────────────────────────────────

const BASE_ALLOCATION = {
  conservative:    { equity: 20, debt: 60, gold: 10, cash: 10 },
  mod_conservative:{ equity: 40, debt: 45, gold: 10, cash: 5 },
  mod_aggressive:  { equity: 60, debt: 30, gold: 7,  cash: 3 },
  aggressive:      { equity: 75, debt: 18, gold: 5,  cash: 2 },
  very_aggressive: { equity: 85, debt: 10, gold: 5,  cash: 0 }
};

function applyGoalOverlay(allocation, goal, timeHorizon) {
  const result = { ...allocation };

  if (goal === 'retirement' && timeHorizon >= 15) {
    result.equity = Math.min(90, result.equity + 5);
    result.debt = Math.max(5, result.debt - 5);
  } else if (goal === 'child_education' && timeHorizon >= 7 && timeHorizon <= 10) {
    result.gold = Math.min(15, result.gold + 5);
    result.equity = Math.min(65, result.equity);
    result.debt = 100 - result.equity - result.gold - result.cash;
  } else if (goal === 'home_purchase' && timeHorizon < 5) {
    result.equity = Math.min(30, result.equity);
    result.debt = 100 - result.equity - result.gold - result.cash;
  } else if (goal === 'emergency_corpus') {
    return { equity: 0, debt: 0, gold: 0, cash: 100 };
  }

  // Normalize to 100
  const total = result.equity + result.debt + result.gold + result.cash;
  if (total !== 100) {
    result.debt += (100 - total);
  }

  return result;
}

function applyTacticalOverlay(allocation, marketData) {
  const result = { ...allocation };
  const signals = [];

  if (!marketData) return { allocation: result, signals };

  const niftyPE = marketData.niftyPE;

  if (niftyPE > 24) {
    result.equity = Math.max(result.equity - 5, 10);
    result.cash = Math.min(result.cash + 5, 20);
    signals.push({ type: 'warning', message: `Nifty P/E at ${niftyPE}x — elevated valuations. SIP preferred over lumpsum.` });
  } else if (niftyPE < 18) {
    result.equity = Math.min(result.equity + 5, 90);
    result.cash = Math.max(result.cash - 5, 0);
    signals.push({ type: 'bullish', message: `Nifty P/E at ${niftyPE}x — attractive valuations. Potential accumulation zone.` });
  } else {
    signals.push({ type: 'neutral', message: `Nifty P/E at ${niftyPE}x — markets fairly valued. Continue SIPs.` });
  }

  if (marketData.niftyDrawdown && marketData.niftyDrawdown < -10) {
    signals.push({ type: 'opportunity', message: `Nifty is ${Math.abs(marketData.niftyDrawdown).toFixed(1)}% below ATH — consider increasing equity SIP.` });
  }

  return { allocation: result, signals };
}

// ─── LAYER 2B: EQUITY SUB-ALLOCATION ─────────────────────────────────────────

const EQUITY_SUB_ALLOCATION = {
  conservative:    { large: 80, mid: 15, small: 5,  intl: 0 },
  mod_conservative:{ large: 65, mid: 25, small: 10, intl: 0 },
  mod_aggressive:  { large: 50, mid: 30, small: 15, intl: 5 },
  aggressive:      { large: 35, mid: 35, small: 20, intl: 10 },
  very_aggressive: { large: 25, mid: 35, small: 25, intl: 15 }
};

function screenStocks(stocksWithFundamentals, bucket, existingHoldings = [], recentSells = []) {
  const existingSymbols = new Set(existingHoldings.map(h => h.tradingsymbol));
  const recentSellSymbols = new Set(recentSells.map(o => o.tradingsymbol));
  const subAlloc = EQUITY_SUB_ALLOCATION[bucket];
  const sectorCount = {};
  const selected = { large: [], mid: [], small: [] };

  for (const [capGroup, stocks] of Object.entries(stocksWithFundamentals)) {
    const capKey = capGroup.replace('_cap', '');
    if (!selected[capKey]) continue;

    for (const stock of stocks) {
      // Exclusion filters
      if (existingSymbols.has(stock.symbol)) continue;
      if (recentSellSymbols.has(stock.symbol)) continue;

      // Fundamental filters
      if (stock.fundamentals) {
        const f = stock.fundamentals;
        if (f.debtToEquity > 2) continue;
        if (f.eps <= 0) continue;
        if (f.pe < 0) continue;
      }

      // Liquidity filter
      if (stock.avgVolumeCr !== undefined && stock.avgVolumeCr < 5) continue;

      // Sector cap (25%)
      const sector = stock.sector;
      sectorCount[sector] = (sectorCount[sector] || 0) + 1;
      const targetCount = capKey === 'large' ? 10 : capKey === 'mid' ? 5 : 4;
      if ((sectorCount[sector] / targetCount) > 0.25) continue;

      selected[capKey].push(stock);
    }
  }

  return {
    large: selected.large.slice(0, 12),
    mid: selected.mid.slice(0, 8),
    small: selected.small.slice(0, 5)
  };
}

// ─── LAYER 2C: DEBT SUB-ALLOCATION ───────────────────────────────────────────

function getDebtSubAllocation(timeHorizon) {
  if (timeHorizon < 1) {
    return { liquid: 100, shortDuration: 0, corporateBond: 0, dynamicBond: 0 };
  } else if (timeHorizon < 3) {
    return { liquid: 20, shortDuration: 80, corporateBond: 0, dynamicBond: 0 };
  } else if (timeHorizon < 7) {
    return { liquid: 10, shortDuration: 30, corporateBond: 40, dynamicBond: 20 };
  } else {
    return { liquid: 5, shortDuration: 10, corporateBond: 30, dynamicBond: 55 };
  }
}

// ─── LAYER 2D: MF CATEGORY SELECTION ─────────────────────────────────────────

function selectMFCategories(bucket, allocation, timeHorizon, investableCorpus) {
  const categories = [];
  const subAlloc = EQUITY_SUB_ALLOCATION[bucket];
  const debtSplit = getDebtSubAllocation(timeHorizon);
  const useDirectStocks = investableCorpus >= 500000; // 5 lakhs

  // Equity MF selection
  if (allocation.equity > 0) {
    if (subAlloc.large >= 50) categories.push('large_cap_index');
    if (subAlloc.large < 50 || bucket === 'mod_aggressive') categories.push('flexi_cap');
    if (subAlloc.mid >= 25) categories.push('mid_cap');
    if (subAlloc.small >= 15) categories.push('small_cap');
    if (bucket === 'conservative' || bucket === 'mod_conservative') categories.push('balanced_advantage');
    if (bucket === 'mod_conservative' || bucket === 'mod_aggressive') categories.push('multi_asset');
    if (subAlloc.large >= 35 && subAlloc.mid >= 25) categories.push('large_mid_cap');
  }

  // Debt MF selection
  if (allocation.debt > 0) {
    if (debtSplit.liquid > 0) categories.push('liquid');
    if (debtSplit.shortDuration > 0) categories.push('short_duration');
    if (debtSplit.dynamicBond > 0) categories.push('dynamic_bond');
    if (timeHorizon >= 3) categories.push('banking_psu');
  }

  // Gold
  if (allocation.gold > 0) categories.push('gold_etf');

  // Deduplicate
  return [...new Set(categories)];
}

// ─── PORTFOLIO PROJECTION ─────────────────────────────────────────────────────

const EXPECTED_RETURNS = {
  equity: { conservative: 10, base: 13, optimistic: 16 },
  debt:   { conservative: 6,  base: 7.5, optimistic: 9 },
  gold:   { conservative: 6,  base: 8,  optimistic: 11 },
  cash:   { conservative: 5,  base: 6,  optimistic: 7 }
};

function projectPortfolio(lumpsum, monthlySIP, timeHorizon, allocation) {
  const scenarios = {};

  for (const scenario of ['conservative', 'base', 'optimistic']) {
    const blendedReturn = (
      (allocation.equity / 100) * EXPECTED_RETURNS.equity[scenario] +
      (allocation.debt / 100) * EXPECTED_RETURNS.debt[scenario] +
      (allocation.gold / 100) * EXPECTED_RETURNS.gold[scenario] +
      (allocation.cash / 100) * EXPECTED_RETURNS.cash[scenario]
    ) / 100;

    const r = blendedReturn / 12;
    const n = timeHorizon * 12;

    // FV of lumpsum
    const lumpsumFV = lumpsum * Math.pow(1 + blendedReturn, timeHorizon);

    // FV of SIP
    const sipFV = monthlySIP * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);

    scenarios[scenario] = {
      totalInvested: lumpsum + (monthlySIP * n),
      futureValue: Math.round(lumpsumFV + sipFV),
      blendedCAGR: (blendedReturn * 100).toFixed(1),
      wealthGain: Math.round(lumpsumFV + sipFV - lumpsum - (monthlySIP * n))
    };
  }

  return scenarios;
}

// ─── REBALANCING CHECK ────────────────────────────────────────────────────────

function checkRebalancingNeeded(currentAllocation, targetAllocation) {
  const alerts = [];
  for (const [asset, target] of Object.entries(targetAllocation)) {
    const current = currentAllocation[asset] || 0;
    const drift = Math.abs(current - target);
    if (drift >= 5) {
      alerts.push({
        asset,
        target,
        current: Math.round(current),
        drift: Math.round(drift),
        action: current > target ? 'reduce' : 'increase'
      });
    }
  }
  return alerts;
}

// ─── PSYCHOMETRIC SCORING ─────────────────────────────────────────────────────

function scorePsychometric(answers) {
  // answers: array of {questionId, answer, score (0-100)}
  if (!answers || answers.length === 0) return 50;
  const avg = answers.reduce((sum, a) => sum + (a.score || 50), 0) / answers.length;
  return Math.round(avg);
}

const PSYCHOMETRIC_QUESTIONS = [
  {
    id: 'q1',
    question: 'If your portfolio dropped 20% in one month, what would you do?',
    options: [
      { label: 'Buy more — great opportunity', score: 100 },
      { label: 'Hold — it will recover', score: 70 },
      { label: 'Sell some to reduce risk', score: 35 },
      { label: 'Sell all — preserve capital', score: 0 }
    ]
  },
  {
    id: 'q2',
    question: 'Your ₹10L portfolio drops to ₹7L temporarily. How do you feel?',
    options: [
      { label: 'Fine, markets recover long-term', score: 100 },
      { label: 'Uncomfortable but I\'ll hold', score: 65 },
      { label: 'Very stressed, considering exit', score: 30 },
      { label: 'Cannot handle this loss', score: 0 }
    ]
  },
  {
    id: 'q3',
    question: 'What is more important to you?',
    options: [
      { label: 'Growing wealth aggressively', score: 100 },
      { label: 'Balance of growth and safety', score: 65 },
      { label: 'Preserving what I have', score: 25 },
      { label: 'Not losing money at all', score: 0 }
    ]
  },
  {
    id: 'q4',
    question: 'How long can you leave money invested without needing it?',
    options: [
      { label: '10+ years easily', score: 100 },
      { label: '5–10 years', score: 75 },
      { label: '3–5 years', score: 45 },
      { label: 'Less than 3 years', score: 15 }
    ]
  },
  {
    id: 'q5',
    question: 'Have you ever exited an investment at a loss?',
    options: [
      { label: 'Never — I always hold through downturns', score: 90 },
      { label: 'Once, but regretted it', score: 60 },
      { label: 'Yes, when losses were too painful', score: 25 },
      { label: 'Yes, multiple times', score: 0 }
    ]
  },
  {
    id: 'q6',
    question: 'Which investment would you choose?',
    options: [
      { label: 'Potential 20% return with risk of -8%', score: 100 },
      { label: 'Potential 15% return with risk of -5%', score: 70 },
      { label: 'Potential 10% return with risk of -2%', score: 35 },
      { label: 'Guaranteed 7% return, no downside', score: 0 }
    ]
  }
];

module.exports = {
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
  STOCK_UNIVERSE,
  BUCKET_ORDER
};
