// /**
//  * WEALTH ALLOCATOR — CORE ENGINE
//  * All allocation rules, risk scoring, and stock screening logic
//  */

// // ─── STOCK UNIVERSE (NSE 500 curated subset with tokens) ─────────────────────
// // In production, load this from a JSON file. Token = Angel One symbol token.
// const STOCK_UNIVERSE = {
//   large_cap: [
//     { symbol: 'RELIANCE', token: '2885', sector: 'Energy', name: 'Reliance Industries' },
//     { symbol: 'TCS', token: '11536', sector: 'IT', name: 'Tata Consultancy Services' },
//     { symbol: 'HDFCBANK', token: '1333', sector: 'Banking', name: 'HDFC Bank' },
//     { symbol: 'INFY', token: '1594', sector: 'IT', name: 'Infosys' },
//     { symbol: 'ICICIBANK', token: '4963', sector: 'Banking', name: 'ICICI Bank' },
//     { symbol: 'HINDUNILVR', token: '1394', sector: 'FMCG', name: 'Hindustan Unilever' },
//     { symbol: 'SBIN', token: '3045', sector: 'Banking', name: 'State Bank of India' },
//     { symbol: 'BHARTIARTL', token: '10604', sector: 'Telecom', name: 'Bharti Airtel' },
//     { symbol: 'KOTAKBANK', token: '1922', sector: 'Banking', name: 'Kotak Mahindra Bank' },
//     { symbol: 'LT', token: '11483', sector: 'Infrastructure', name: 'Larsen & Toubro' },
//     { symbol: 'ASIANPAINT', token: '236', sector: 'Paints', name: 'Asian Paints' },
//     { symbol: 'AXISBANK', token: '5900', sector: 'Banking', name: 'Axis Bank' },
//     { symbol: 'MARUTI', token: '10999', sector: 'Auto', name: 'Maruti Suzuki' },
//     { symbol: 'TITAN', token: '3506', sector: 'Consumer', name: 'Titan Company' },
//     { symbol: 'SUNPHARMA', token: '3351', sector: 'Pharma', name: 'Sun Pharmaceutical' },
//     { symbol: 'ULTRACEMCO', token: '11532', sector: 'Cement', name: 'UltraTech Cement' },
//     { symbol: 'WIPRO', token: '3787', sector: 'IT', name: 'Wipro' },
//     { symbol: 'ONGC', token: '2475', sector: 'Energy', name: 'ONGC' },
//     { symbol: 'NTPC', token: '11630', sector: 'Power', name: 'NTPC' },
//     { symbol: 'POWERGRID', token: '14977', sector: 'Power', name: 'Power Grid Corporation' }
//   ],
//   mid_cap: [
//     { symbol: 'PERSISTENT', token: '18365', sector: 'IT', name: 'Persistent Systems' },
//     { symbol: 'DIXON', token: '17854', sector: 'Electronics', name: 'Dixon Technologies' },
//     { symbol: 'ASTRAL', token: '14418', sector: 'Pipes', name: 'Astral Ltd' },
//     { symbol: 'COFORGE', token: '17488', sector: 'IT', name: 'Coforge' },
//     { symbol: 'CROMPTON', token: '17094', sector: 'Consumer', name: 'Crompton Greaves' },
//     { symbol: 'VOLTAS', token: '3718', sector: 'Consumer', name: 'Voltas' },
//     { symbol: 'PAGEIND', token: '14413', sector: 'Consumer', name: 'Page Industries' },
//     { symbol: 'SUPREMEIND', token: '3442', sector: 'Plastics', name: 'Supreme Industries' },
//     { symbol: 'AAVAS', token: '19089', sector: 'Finance', name: 'Aavas Financiers' },
//     { symbol: 'KANSAINER', token: '19234', sector: 'Paints', name: 'Kansai Nerolac' }
//   ],
//   small_cap: [
//     { symbol: 'ELECON', token: '1790', sector: 'Engineering', name: 'Elecon Engineering' },
//     { symbol: 'GAEL', token: '1251', sector: 'FMCG', name: 'Gujarat Ambuja Exports' },
//     { symbol: 'ORIENTELEC', token: '14767', sector: 'Consumer', name: 'Orient Electric' },
//     { symbol: 'GALAXYSURF', token: '1417', sector: 'Chemicals', name: 'Galaxy Surfactants' },
//     { symbol: 'BALRAMCHIN', token: '500', sector: 'Sugar', name: 'Balrampur Chini Mills' },
//     { symbol: 'JINDALSAW', token: '1669', sector: 'Steel', name: 'Jindal SAW' },
//     { symbol: 'NIITLTD', token: '2160', sector: 'IT Services', name: 'NIIT Ltd' },
//     { symbol: 'KITEX', token: '14939', sector: 'Textiles', name: 'Kitex Garments' }
//   ]
// };

// // ─── LAYER 1: RISK SCORING ────────────────────────────────────────────────────

// function calculateRiskScore(profile) {
//   const {
//     age,
//     timeHorizon, // years
//     incomeStability, // 'salaried' | 'business' | 'freelance'
//     debtToIncome, // ratio 0-1
//     psychometricScore, // 0-100 from quiz
//     emergencyFundMonths // months of expenses saved
//   } = profile;

//   let score = 0;

//   // Age score (25%)
//   const ageScore = age < 25 ? 100 : age < 35 ? 85 : age < 45 ? 65 : age < 55 ? 40 : 20;
//   score += ageScore * 0.25;

//   // Time horizon (20%)
//   const horizonScore = timeHorizon >= 15 ? 100 : timeHorizon >= 10 ? 80 : timeHorizon >= 7 ? 65 : timeHorizon >= 5 ? 50 : timeHorizon >= 3 ? 30 : 10;
//   score += horizonScore * 0.20;

//   // Income stability (15%)
//   const stabilityScore = incomeStability === 'salaried' ? 80 : incomeStability === 'business' ? 50 : 40;
//   score += stabilityScore * 0.15;

//   // Liabilities (10%)
//   const liabilityScore = debtToIncome < 0.1 ? 100 : debtToIncome < 0.2 ? 80 : debtToIncome < 0.3 ? 60 : debtToIncome < 0.4 ? 40 : 10;
//   score += liabilityScore * 0.10;

//   // Psychometric quiz (20%)
//   score += (psychometricScore || 50) * 0.20;

//   // Emergency fund (10%)
//   const emergencyScore = emergencyFundMonths >= 6 ? 100 : emergencyFundMonths >= 3 ? 60 : emergencyFundMonths >= 1 ? 30 : 0;
//   score += emergencyScore * 0.10;

//   return Math.round(score);
// }

// function getRiskBucket(score, profile) {
//   let bucket;
//   if (score <= 30) bucket = 'conservative';
//   else if (score <= 55) bucket = 'mod_conservative';
//   else if (score <= 70) bucket = 'mod_aggressive';
//   else if (score <= 85) bucket = 'aggressive';
//   else bucket = 'very_aggressive';

//   // Hard overrides
//   if (profile.age > 55) bucket = capBucket(bucket, 'mod_conservative');
//   if (profile.emergencyFundMonths < 1) bucket = downgradeBucket(bucket);
//   if (profile.debtToIncome > 0.40) bucket = downgradeBucket(bucket);
//   if (profile.timeHorizon < 3) bucket = capBucket(bucket, 'mod_conservative');

//   return bucket;
// }

// const BUCKET_ORDER = ['conservative', 'mod_conservative', 'mod_aggressive', 'aggressive', 'very_aggressive'];

// function capBucket(current, cap) {
//   const cIdx = BUCKET_ORDER.indexOf(current);
//   const capIdx = BUCKET_ORDER.indexOf(cap);
//   return cIdx > capIdx ? cap : current;
// }

// function downgradeBucket(current) {
//   const idx = BUCKET_ORDER.indexOf(current);
//   return idx > 0 ? BUCKET_ORDER[idx - 1] : current;
// }

// // ─── LAYER 2A: STRATEGIC ASSET ALLOCATION ────────────────────────────────────

// const BASE_ALLOCATION = {
//   conservative:    { equity: 20, debt: 60, gold: 10, cash: 10 },
//   mod_conservative:{ equity: 40, debt: 45, gold: 10, cash: 5 },
//   mod_aggressive:  { equity: 60, debt: 30, gold: 7,  cash: 3 },
//   aggressive:      { equity: 75, debt: 18, gold: 5,  cash: 2 },
//   very_aggressive: { equity: 85, debt: 10, gold: 5,  cash: 0 }
// };

// function applyGoalOverlay(allocation, goal, timeHorizon) {
//   const result = { ...allocation };

//   if (goal === 'retirement' && timeHorizon >= 15) {
//     result.equity = Math.min(90, result.equity + 5);
//     result.debt = Math.max(5, result.debt - 5);
//   } else if (goal === 'child_education' && timeHorizon >= 7 && timeHorizon <= 10) {
//     result.gold = Math.min(15, result.gold + 5);
//     result.equity = Math.min(65, result.equity);
//     result.debt = 100 - result.equity - result.gold - result.cash;
//   } else if (goal === 'home_purchase' && timeHorizon < 5) {
//     result.equity = Math.min(30, result.equity);
//     result.debt = 100 - result.equity - result.gold - result.cash;
//   } else if (goal === 'emergency_corpus') {
//     return { equity: 0, debt: 0, gold: 0, cash: 100 };
//   }

//   // Normalize to 100
//   const total = result.equity + result.debt + result.gold + result.cash;
//   if (total !== 100) {
//     result.debt += (100 - total);
//   }

//   return result;
// }

// function applyTacticalOverlay(allocation, marketData) {
//   const result = { ...allocation };
//   const signals = [];

//   if (!marketData) return { allocation: result, signals };

//   const niftyPE = marketData.niftyPE;

//   if (niftyPE > 24) {
//     result.equity = Math.max(result.equity - 5, 10);
//     result.cash = Math.min(result.cash + 5, 20);
//     signals.push({ type: 'warning', message: `Nifty P/E at ${niftyPE}x — elevated valuations. SIP preferred over lumpsum.` });
//   } else if (niftyPE < 18) {
//     result.equity = Math.min(result.equity + 5, 90);
//     result.cash = Math.max(result.cash - 5, 0);
//     signals.push({ type: 'bullish', message: `Nifty P/E at ${niftyPE}x — attractive valuations. Potential accumulation zone.` });
//   } else {
//     signals.push({ type: 'neutral', message: `Nifty P/E at ${niftyPE}x — markets fairly valued. Continue SIPs.` });
//   }

//   if (marketData.niftyDrawdown && marketData.niftyDrawdown < -10) {
//     signals.push({ type: 'opportunity', message: `Nifty is ${Math.abs(marketData.niftyDrawdown).toFixed(1)}% below ATH — consider increasing equity SIP.` });
//   }

//   return { allocation: result, signals };
// }

// // ─── LAYER 2B: EQUITY SUB-ALLOCATION ─────────────────────────────────────────

// const EQUITY_SUB_ALLOCATION = {
//   conservative:    { large: 80, mid: 15, small: 5,  intl: 0 },
//   mod_conservative:{ large: 65, mid: 25, small: 10, intl: 0 },
//   mod_aggressive:  { large: 50, mid: 30, small: 15, intl: 5 },
//   aggressive:      { large: 35, mid: 35, small: 20, intl: 10 },
//   very_aggressive: { large: 25, mid: 35, small: 25, intl: 15 }
// };

// function screenStocks(stocksWithFundamentals, bucket, existingHoldings = [], recentSells = []) {
//   const existingSymbols = new Set(existingHoldings.map(h => h.tradingsymbol));
//   const recentSellSymbols = new Set(recentSells.map(o => o.tradingsymbol));
//   const subAlloc = EQUITY_SUB_ALLOCATION[bucket];
//   const sectorCount = {};
//   const selected = { large: [], mid: [], small: [] };

//   for (const [capGroup, stocks] of Object.entries(stocksWithFundamentals)) {
//     const capKey = capGroup.replace('_cap', '');
//     if (!selected[capKey]) continue;

//     for (const stock of stocks) {
//       // Exclusion filters
//       if (existingSymbols.has(stock.symbol)) continue;
//       if (recentSellSymbols.has(stock.symbol)) continue;

//       // Fundamental filters
//       if (stock.fundamentals) {
//         const f = stock.fundamentals;
//         if (f.debtToEquity > 2) continue;
//         if (f.eps <= 0) continue;
//         if (f.pe < 0) continue;
//       }

//       // Liquidity filter
//       if (stock.avgVolumeCr !== undefined && stock.avgVolumeCr < 5) continue;

//       // Sector cap (25%)
//       const sector = stock.sector;
//       sectorCount[sector] = (sectorCount[sector] || 0) + 1;
//       const targetCount = capKey === 'large' ? 10 : capKey === 'mid' ? 5 : 4;
//       if ((sectorCount[sector] / targetCount) > 0.25) continue;

//       selected[capKey].push(stock);
//     }
//   }

//   return {
//     large: selected.large.slice(0, 12),
//     mid: selected.mid.slice(0, 8),
//     small: selected.small.slice(0, 5)
//   };
// }

// // ─── LAYER 2C: DEBT SUB-ALLOCATION ───────────────────────────────────────────

// function getDebtSubAllocation(timeHorizon) {
//   if (timeHorizon < 1) {
//     return { liquid: 100, shortDuration: 0, corporateBond: 0, dynamicBond: 0 };
//   } else if (timeHorizon < 3) {
//     return { liquid: 20, shortDuration: 80, corporateBond: 0, dynamicBond: 0 };
//   } else if (timeHorizon < 7) {
//     return { liquid: 10, shortDuration: 30, corporateBond: 40, dynamicBond: 20 };
//   } else {
//     return { liquid: 5, shortDuration: 10, corporateBond: 30, dynamicBond: 55 };
//   }
// }

// // ─── LAYER 2D: MF CATEGORY SELECTION ─────────────────────────────────────────

// function selectMFCategories(bucket, allocation, timeHorizon, investableCorpus) {
//   const categories = [];
//   const subAlloc = EQUITY_SUB_ALLOCATION[bucket];
//   const debtSplit = getDebtSubAllocation(timeHorizon);
//   const useDirectStocks = investableCorpus >= 500000; // 5 lakhs

//   // Equity MF selection
//   if (allocation.equity > 0) {
//     if (subAlloc.large >= 50) categories.push('large_cap_index');
//     if (subAlloc.large < 50 || bucket === 'mod_aggressive') categories.push('flexi_cap');
//     if (subAlloc.mid >= 25) categories.push('mid_cap');
//     if (subAlloc.small >= 15) categories.push('small_cap');
//     if (bucket === 'conservative' || bucket === 'mod_conservative') categories.push('balanced_advantage');
//     if (bucket === 'mod_conservative' || bucket === 'mod_aggressive') categories.push('multi_asset');
//     if (subAlloc.large >= 35 && subAlloc.mid >= 25) categories.push('large_mid_cap');
//   }

//   // Debt MF selection
//   if (allocation.debt > 0) {
//     if (debtSplit.liquid > 0) categories.push('liquid');
//     if (debtSplit.shortDuration > 0) categories.push('short_duration');
//     if (debtSplit.dynamicBond > 0) categories.push('dynamic_bond');
//     if (timeHorizon >= 3) categories.push('banking_psu');
//   }

//   // Gold
//   if (allocation.gold > 0) categories.push('gold_etf');

//   // Deduplicate
//   return [...new Set(categories)];
// }

// // ─── PORTFOLIO PROJECTION ─────────────────────────────────────────────────────

// const EXPECTED_RETURNS = {
//   equity: { conservative: 10, base: 13, optimistic: 16 },
//   debt:   { conservative: 6,  base: 7.5, optimistic: 9 },
//   gold:   { conservative: 6,  base: 8,  optimistic: 11 },
//   cash:   { conservative: 5,  base: 6,  optimistic: 7 }
// };

// function projectPortfolio(lumpsum, monthlySIP, timeHorizon, allocation) {
//   const scenarios = {};

//   for (const scenario of ['conservative', 'base', 'optimistic']) {
//     const blendedReturn = (
//       (allocation.equity / 100) * EXPECTED_RETURNS.equity[scenario] +
//       (allocation.debt / 100) * EXPECTED_RETURNS.debt[scenario] +
//       (allocation.gold / 100) * EXPECTED_RETURNS.gold[scenario] +
//       (allocation.cash / 100) * EXPECTED_RETURNS.cash[scenario]
//     ) / 100;

//     const r = blendedReturn / 12;
//     const n = timeHorizon * 12;

//     // FV of lumpsum
//     const lumpsumFV = lumpsum * Math.pow(1 + blendedReturn, timeHorizon);

//     // FV of SIP
//     const sipFV = monthlySIP * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);

//     scenarios[scenario] = {
//       totalInvested: lumpsum + (monthlySIP * n),
//       futureValue: Math.round(lumpsumFV + sipFV),
//       blendedCAGR: (blendedReturn * 100).toFixed(1),
//       wealthGain: Math.round(lumpsumFV + sipFV - lumpsum - (monthlySIP * n))
//     };
//   }

//   return scenarios;
// }

// // ─── REBALANCING CHECK ────────────────────────────────────────────────────────

// function checkRebalancingNeeded(currentAllocation, targetAllocation) {
//   const alerts = [];
//   for (const [asset, target] of Object.entries(targetAllocation)) {
//     const current = currentAllocation[asset] || 0;
//     const drift = Math.abs(current - target);
//     if (drift >= 5) {
//       alerts.push({
//         asset,
//         target,
//         current: Math.round(current),
//         drift: Math.round(drift),
//         action: current > target ? 'reduce' : 'increase'
//       });
//     }
//   }
//   return alerts;
// }

// // ─── PSYCHOMETRIC SCORING ─────────────────────────────────────────────────────

// function scorePsychometric(answers) {
//   // answers: array of {questionId, answer, score (0-100)}
//   if (!answers || answers.length === 0) return 50;
//   const avg = answers.reduce((sum, a) => sum + (a.score || 50), 0) / answers.length;
//   return Math.round(avg);
// }

// const PSYCHOMETRIC_QUESTIONS = [
//   {
//     id: 'q1',
//     question: 'If your portfolio dropped 20% in one month, what would you do?',
//     options: [
//       { label: 'Buy more — great opportunity', score: 100 },
//       { label: 'Hold — it will recover', score: 70 },
//       { label: 'Sell some to reduce risk', score: 35 },
//       { label: 'Sell all — preserve capital', score: 0 }
//     ]
//   },
//   {
//     id: 'q2',
//     question: 'Your ₹10L portfolio drops to ₹7L temporarily. How do you feel?',
//     options: [
//       { label: 'Fine, markets recover long-term', score: 100 },
//       { label: 'Uncomfortable but I\'ll hold', score: 65 },
//       { label: 'Very stressed, considering exit', score: 30 },
//       { label: 'Cannot handle this loss', score: 0 }
//     ]
//   },
//   {
//     id: 'q3',
//     question: 'What is more important to you?',
//     options: [
//       { label: 'Growing wealth aggressively', score: 100 },
//       { label: 'Balance of growth and safety', score: 65 },
//       { label: 'Preserving what I have', score: 25 },
//       { label: 'Not losing money at all', score: 0 }
//     ]
//   },
//   {
//     id: 'q4',
//     question: 'How long can you leave money invested without needing it?',
//     options: [
//       { label: '10+ years easily', score: 100 },
//       { label: '5–10 years', score: 75 },
//       { label: '3–5 years', score: 45 },
//       { label: 'Less than 3 years', score: 15 }
//     ]
//   },
//   {
//     id: 'q5',
//     question: 'Have you ever exited an investment at a loss?',
//     options: [
//       { label: 'Never — I always hold through downturns', score: 90 },
//       { label: 'Once, but regretted it', score: 60 },
//       { label: 'Yes, when losses were too painful', score: 25 },
//       { label: 'Yes, multiple times', score: 0 }
//     ]
//   },
//   {
//     id: 'q6',
//     question: 'Which investment would you choose?',
//     options: [
//       { label: 'Potential 20% return with risk of -8%', score: 100 },
//       { label: 'Potential 15% return with risk of -5%', score: 70 },
//       { label: 'Potential 10% return with risk of -2%', score: 35 },
//       { label: 'Guaranteed 7% return, no downside', score: 0 }
//     ]
//   }
// ];

// module.exports = {
//   calculateRiskScore,
//   getRiskBucket,
//   BASE_ALLOCATION,
//   applyGoalOverlay,
//   applyTacticalOverlay,
//   EQUITY_SUB_ALLOCATION,
//   screenStocks,
//   getDebtSubAllocation,
//   selectMFCategories,
//   projectPortfolio,
//   checkRebalancingNeeded,
//   scorePsychometric,
//   PSYCHOMETRIC_QUESTIONS,
//   STOCK_UNIVERSE,
//   BUCKET_ORDER
// };

/**
 * WEALTH ALLOCATOR — CORE ENGINE
 * All allocation rules, risk scoring, stock screening, and AI scoring logic
 */

// ─── STOCK UNIVERSE ───────────────────────────────────────────────────────────
const STOCK_UNIVERSE = {
  large_cap: [
    {
      symbol: "RELIANCE",
      token: "2885",
      sector: "Energy",
      name: "Reliance Industries",
    },
    {
      symbol: "TCS",
      token: "11536",
      sector: "IT",
      name: "Tata Consultancy Services",
    },
    { symbol: "HDFCBANK", token: "1333", sector: "Banking", name: "HDFC Bank" },
    { symbol: "INFY", token: "1594", sector: "IT", name: "Infosys" },
    {
      symbol: "ICICIBANK",
      token: "4963",
      sector: "Banking",
      name: "ICICI Bank",
    },
    {
      symbol: "HINDUNILVR",
      token: "1394",
      sector: "FMCG",
      name: "Hindustan Unilever",
    },
    {
      symbol: "SBIN",
      token: "3045",
      sector: "Banking",
      name: "State Bank of India",
    },
    {
      symbol: "BHARTIARTL",
      token: "10604",
      sector: "Telecom",
      name: "Bharti Airtel",
    },
    {
      symbol: "KOTAKBANK",
      token: "1922",
      sector: "Banking",
      name: "Kotak Mahindra Bank",
    },
    {
      symbol: "LT",
      token: "11483",
      sector: "Infrastructure",
      name: "Larsen & Toubro",
    },
    {
      symbol: "ASIANPAINT",
      token: "236",
      sector: "Paints",
      name: "Asian Paints",
    },
    { symbol: "AXISBANK", token: "5900", sector: "Banking", name: "Axis Bank" },
    { symbol: "MARUTI", token: "10999", sector: "Auto", name: "Maruti Suzuki" },
    {
      symbol: "TITAN",
      token: "3506",
      sector: "Consumer",
      name: "Titan Company",
    },
    {
      symbol: "SUNPHARMA",
      token: "3351",
      sector: "Pharma",
      name: "Sun Pharmaceutical",
    },
    {
      symbol: "ULTRACEMCO",
      token: "11532",
      sector: "Cement",
      name: "UltraTech Cement",
    },
    { symbol: "WIPRO", token: "3787", sector: "IT", name: "Wipro" },
    { symbol: "ONGC", token: "2475", sector: "Energy", name: "ONGC" },
    { symbol: "NTPC", token: "11630", sector: "Power", name: "NTPC" },
    {
      symbol: "POWERGRID",
      token: "14977",
      sector: "Power",
      name: "Power Grid Corporation",
    },
  ],
  mid_cap: [
    {
      symbol: "PERSISTENT",
      token: "18365",
      sector: "IT",
      name: "Persistent Systems",
    },
    {
      symbol: "DIXON",
      token: "17854",
      sector: "Electronics",
      name: "Dixon Technologies",
    },
    { symbol: "ASTRAL", token: "14418", sector: "Pipes", name: "Astral Ltd" },
    { symbol: "COFORGE", token: "17488", sector: "IT", name: "Coforge" },
    {
      symbol: "CROMPTON",
      token: "17094",
      sector: "Consumer",
      name: "Crompton Greaves",
    },
    { symbol: "VOLTAS", token: "3718", sector: "Consumer", name: "Voltas" },
    {
      symbol: "PAGEIND",
      token: "14413",
      sector: "Consumer",
      name: "Page Industries",
    },
    {
      symbol: "SUPREMEIND",
      token: "3442",
      sector: "Plastics",
      name: "Supreme Industries",
    },
    {
      symbol: "AAVAS",
      token: "19089",
      sector: "Finance",
      name: "Aavas Financiers",
    },
    {
      symbol: "KANSAINER",
      token: "19234",
      sector: "Paints",
      name: "Kansai Nerolac",
    },
  ],
  small_cap: [
    {
      symbol: "ELECON",
      token: "1790",
      sector: "Engineering",
      name: "Elecon Engineering",
    },
    {
      symbol: "GAEL",
      token: "1251",
      sector: "FMCG",
      name: "Gujarat Ambuja Exports",
    },
    {
      symbol: "ORIENTELEC",
      token: "14767",
      sector: "Consumer",
      name: "Orient Electric",
    },
    {
      symbol: "GALAXYSURF",
      token: "1417",
      sector: "Chemicals",
      name: "Galaxy Surfactants",
    },
    {
      symbol: "BALRAMCHIN",
      token: "500",
      sector: "Sugar",
      name: "Balrampur Chini Mills",
    },
    { symbol: "JINDALSAW", token: "1669", sector: "Steel", name: "Jindal SAW" },
    {
      symbol: "NIITLTD",
      token: "2160",
      sector: "IT Services",
      name: "NIIT Ltd",
    },
    {
      symbol: "KITEX",
      token: "14939",
      sector: "Textiles",
      name: "Kitex Garments",
    },
  ],
};

// ─── FUNDAMENTAL PROFILES ─────────────────────────────────────────────────────
const STOCK_FUNDAMENTALS = {
  RELIANCE: {
    pe: 26,
    pb: 2.1,
    roe: 9,
    debtToEquity: 0.45,
    eps: 98,
    dividendYield: 0.4,
    revenueGrowthYoY: 8,
    patGrowthYoY: 12,
  },
  TCS: {
    pe: 28,
    pb: 13,
    roe: 52,
    debtToEquity: 0.0,
    eps: 120,
    dividendYield: 1.5,
    revenueGrowthYoY: 6,
    patGrowthYoY: 7,
  },
  HDFCBANK: {
    pe: 18,
    pb: 2.5,
    roe: 16,
    debtToEquity: 0.0,
    eps: 82,
    dividendYield: 1.1,
    revenueGrowthYoY: 18,
    patGrowthYoY: 33,
  },
  INFY: {
    pe: 24,
    pb: 8,
    roe: 32,
    debtToEquity: 0.0,
    eps: 60,
    dividendYield: 2.5,
    revenueGrowthYoY: 4,
    patGrowthYoY: 6,
  },
  ICICIBANK: {
    pe: 17,
    pb: 3.0,
    roe: 18,
    debtToEquity: 0.0,
    eps: 88,
    dividendYield: 0.8,
    revenueGrowthYoY: 22,
    patGrowthYoY: 28,
  },
  HINDUNILVR: {
    pe: 52,
    pb: 11,
    roe: 22,
    debtToEquity: 0.0,
    eps: 42,
    dividendYield: 1.8,
    revenueGrowthYoY: 3,
    patGrowthYoY: 5,
  },
  SBIN: {
    pe: 10,
    pb: 1.5,
    roe: 18,
    debtToEquity: 0.0,
    eps: 68,
    dividendYield: 1.8,
    revenueGrowthYoY: 14,
    patGrowthYoY: 22,
  },
  BHARTIARTL: {
    pe: 65,
    pb: 7,
    roe: 14,
    debtToEquity: 1.2,
    eps: 28,
    dividendYield: 0.4,
    revenueGrowthYoY: 18,
    patGrowthYoY: 95,
  },
  KOTAKBANK: {
    pe: 20,
    pb: 3.0,
    roe: 15,
    debtToEquity: 0.0,
    eps: 72,
    dividendYield: 0.1,
    revenueGrowthYoY: 16,
    patGrowthYoY: 18,
  },
  LT: {
    pe: 32,
    pb: 4.5,
    roe: 14,
    debtToEquity: 0.3,
    eps: 88,
    dividendYield: 1.0,
    revenueGrowthYoY: 18,
    patGrowthYoY: 16,
  },
  ASIANPAINT: {
    pe: 55,
    pb: 15,
    roe: 28,
    debtToEquity: 0.0,
    eps: 34,
    dividendYield: 1.0,
    revenueGrowthYoY: 2,
    patGrowthYoY: -8,
  },
  AXISBANK: {
    pe: 14,
    pb: 2.1,
    roe: 17,
    debtToEquity: 0.0,
    eps: 78,
    dividendYield: 0.1,
    revenueGrowthYoY: 20,
    patGrowthYoY: 24,
  },
  MARUTI: {
    pe: 28,
    pb: 5.5,
    roe: 19,
    debtToEquity: 0.0,
    eps: 380,
    dividendYield: 1.2,
    revenueGrowthYoY: 10,
    patGrowthYoY: 22,
  },
  TITAN: {
    pe: 85,
    pb: 22,
    roe: 28,
    debtToEquity: 0.0,
    eps: 38,
    dividendYield: 0.3,
    revenueGrowthYoY: 18,
    patGrowthYoY: 20,
  },
  SUNPHARMA: {
    pe: 38,
    pb: 6.5,
    roe: 18,
    debtToEquity: 0.1,
    eps: 52,
    dividendYield: 0.9,
    revenueGrowthYoY: 12,
    patGrowthYoY: 28,
  },
  ULTRACEMCO: {
    pe: 42,
    pb: 6.0,
    roe: 15,
    debtToEquity: 0.2,
    eps: 190,
    dividendYield: 0.3,
    revenueGrowthYoY: 6,
    patGrowthYoY: 42,
  },
  WIPRO: {
    pe: 22,
    pb: 4.5,
    roe: 20,
    debtToEquity: 0.0,
    eps: 22,
    dividendYield: 0.2,
    revenueGrowthYoY: 2,
    patGrowthYoY: 4,
  },
  ONGC: {
    pe: 8,
    pb: 0.9,
    roe: 12,
    debtToEquity: 0.5,
    eps: 38,
    dividendYield: 5.5,
    revenueGrowthYoY: -5,
    patGrowthYoY: 18,
  },
  NTPC: {
    pe: 18,
    pb: 2.5,
    roe: 13,
    debtToEquity: 1.1,
    eps: 22,
    dividendYield: 2.5,
    revenueGrowthYoY: 8,
    patGrowthYoY: 22,
  },
  POWERGRID: {
    pe: 16,
    pb: 3.2,
    roe: 20,
    debtToEquity: 1.3,
    eps: 24,
    dividendYield: 3.5,
    revenueGrowthYoY: 5,
    patGrowthYoY: 12,
  },
  PERSISTENT: {
    pe: 52,
    pb: 12,
    roe: 24,
    debtToEquity: 0.0,
    eps: 88,
    dividendYield: 0.4,
    revenueGrowthYoY: 28,
    patGrowthYoY: 32,
  },
  DIXON: {
    pe: 145,
    pb: 22,
    roe: 16,
    debtToEquity: 0.2,
    eps: 42,
    dividendYield: 0.1,
    revenueGrowthYoY: 88,
    patGrowthYoY: 60,
  },
  ASTRAL: {
    pe: 68,
    pb: 12,
    roe: 19,
    debtToEquity: 0.0,
    eps: 38,
    dividendYield: 0.1,
    revenueGrowthYoY: 10,
    patGrowthYoY: 22,
  },
  COFORGE: {
    pe: 38,
    pb: 8,
    roe: 22,
    debtToEquity: 0.1,
    eps: 82,
    dividendYield: 1.2,
    revenueGrowthYoY: 22,
    patGrowthYoY: 28,
  },
  CROMPTON: {
    pe: 35,
    pb: 8,
    roe: 24,
    debtToEquity: 0.1,
    eps: 8,
    dividendYield: 0.4,
    revenueGrowthYoY: 4,
    patGrowthYoY: 12,
  },
  VOLTAS: {
    pe: 65,
    pb: 6,
    roe: 10,
    debtToEquity: 0.0,
    eps: 18,
    dividendYield: 0.2,
    revenueGrowthYoY: 22,
    patGrowthYoY: 45,
  },
  PAGEIND: {
    pe: 48,
    pb: 18,
    roe: 38,
    debtToEquity: 0.1,
    eps: 580,
    dividendYield: 1.8,
    revenueGrowthYoY: 8,
    patGrowthYoY: 12,
  },
  SUPREMEIND: {
    pe: 42,
    pb: 9,
    roe: 22,
    debtToEquity: 0.0,
    eps: 88,
    dividendYield: 0.8,
    revenueGrowthYoY: 10,
    patGrowthYoY: 18,
  },
  AAVAS: {
    pe: 28,
    pb: 3.5,
    roe: 13,
    debtToEquity: 3.5,
    eps: 72,
    dividendYield: 0.0,
    revenueGrowthYoY: 18,
    patGrowthYoY: 22,
  },
  KANSAINER: {
    pe: 38,
    pb: 4.5,
    roe: 12,
    debtToEquity: 0.0,
    eps: 14,
    dividendYield: 1.5,
    revenueGrowthYoY: 5,
    patGrowthYoY: 8,
  },
  ELECON: {
    pe: 28,
    pb: 4.8,
    roe: 18,
    debtToEquity: 0.2,
    eps: 18,
    dividendYield: 0.3,
    revenueGrowthYoY: 22,
    patGrowthYoY: 42,
  },
  GAEL: {
    pe: 14,
    pb: 2.2,
    roe: 16,
    debtToEquity: 0.1,
    eps: 12,
    dividendYield: 0.5,
    revenueGrowthYoY: 8,
    patGrowthYoY: 5,
  },
  ORIENTELEC: {
    pe: 32,
    pb: 5,
    roe: 16,
    debtToEquity: 0.2,
    eps: 6,
    dividendYield: 0.5,
    revenueGrowthYoY: 5,
    patGrowthYoY: 8,
  },
  GALAXYSURF: {
    pe: 32,
    pb: 5.5,
    roe: 18,
    debtToEquity: 0.0,
    eps: 62,
    dividendYield: 0.8,
    revenueGrowthYoY: 8,
    patGrowthYoY: 12,
  },
  BALRAMCHIN: {
    pe: 12,
    pb: 2.0,
    roe: 18,
    debtToEquity: 0.3,
    eps: 12,
    dividendYield: 1.5,
    revenueGrowthYoY: -5,
    patGrowthYoY: 15,
  },
  JINDALSAW: {
    pe: 10,
    pb: 1.2,
    roe: 14,
    debtToEquity: 0.8,
    eps: 28,
    dividendYield: 0.8,
    revenueGrowthYoY: 5,
    patGrowthYoY: 22,
  },
  NIITLTD: {
    pe: 18,
    pb: 2.8,
    roe: 18,
    debtToEquity: 0.1,
    eps: 8,
    dividendYield: 0.0,
    revenueGrowthYoY: 12,
    patGrowthYoY: 18,
  },
  KITEX: {
    pe: 14,
    pb: 1.8,
    roe: 14,
    debtToEquity: 0.2,
    eps: 10,
    dividendYield: 2.0,
    revenueGrowthYoY: 8,
    patGrowthYoY: 10,
  },
};

const SECTOR_PE_MEDIAN = {
  Banking: 15,
  IT: 28,
  Energy: 14,
  FMCG: 48,
  Telecom: 40,
  Infrastructure: 28,
  Paints: 52,
  Auto: 28,
  Consumer: 55,
  Pharma: 36,
  Cement: 38,
  Power: 18,
  Electronics: 80,
  Pipes: 50,
  Plastics: 40,
  Finance: 25,
  Engineering: 28,
  Chemicals: 32,
  Sugar: 12,
  Steel: 10,
  Textiles: 14,
  "IT Services": 20,
};

// ─── SECTOR PREFERENCES BY GOAL ───────────────────────────────────────────────
// Certain goals align with certain sectors
const GOAL_SECTOR_AFFINITY = {
  retirement: { Power: 1.2, Banking: 1.15, FMCG: 1.2, Pharma: 1.15, IT: 1.0 },
  child_education: { IT: 1.2, Pharma: 1.15, FMCG: 1.1, Consumer: 1.1 },
  home_purchase: { Banking: 1.2, Infrastructure: 1.2, Cement: 1.15 },
  wealth_creation: { IT: 1.2, Electronics: 1.2, Consumer: 1.15, Auto: 1.1 },
  emergency_corpus: { FMCG: 1.3, Power: 1.2, Banking: 1.15 },
};

// ─── DYNAMIC FACTOR WEIGHT BUILDER ───────────────────────────────────────────
/**
 * Builds personalised factor weights based on:
 *  - Risk bucket (base weights)
 *  - Age (older → quality + income > momentum + growth)
 *  - Time horizon (short → value + quality; long → growth + momentum)
 *  - Goal (retirement → income; wealth_creation → growth; home → value+quality)
 *  - Income stability (freelance → quality; salaried → can take growth risk)
 *  - Debt burden (high DTI → quality + value; low DTI → growth)
 *  - Psychometric score (low → conservative weights regardless of bucket)
 */
function buildPersonalisedWeights(bucket, userContext) {
  const {
    age = 35,
    goal = "wealth_creation",
    timeHorizon = 10,
    incomeStability = "salaried",
    debtToIncome = 0.2,
    psychometricScore = 50,
  } = userContext;

  // Base weights by bucket
  const BASE_WEIGHTS = {
    conservative: {
      value: 0.3,
      quality: 0.3,
      growth: 0.1,
      momentum: 0.05,
      income: 0.2,
      riskFit: 0.05,
    },
    mod_conservative: {
      value: 0.25,
      quality: 0.25,
      growth: 0.15,
      momentum: 0.1,
      income: 0.15,
      riskFit: 0.1,
    },
    mod_aggressive: {
      value: 0.2,
      quality: 0.2,
      growth: 0.25,
      momentum: 0.15,
      income: 0.1,
      riskFit: 0.1,
    },
    aggressive: {
      value: 0.15,
      quality: 0.15,
      growth: 0.3,
      momentum: 0.25,
      income: 0.05,
      riskFit: 0.1,
    },
    very_aggressive: {
      value: 0.1,
      quality: 0.1,
      growth: 0.35,
      momentum: 0.3,
      income: 0.05,
      riskFit: 0.1,
    },
  };

  const w = { ...BASE_WEIGHTS[bucket] };

  // ── Age adjustments
  if (age >= 55) {
    // Near retirement: prioritise income and quality heavily
    w.income = Math.min(0.35, w.income + 0.15);
    w.quality = Math.min(0.35, w.quality + 0.05);
    w.growth = Math.max(0.05, w.growth - 0.1);
    w.momentum = Math.max(0.02, w.momentum - 0.05);
  } else if (age >= 45) {
    w.income = Math.min(0.3, w.income + 0.08);
    w.quality = Math.min(0.3, w.quality + 0.03);
    w.growth = Math.max(0.08, w.growth - 0.05);
    w.momentum = Math.max(0.03, w.momentum - 0.03);
  } else if (age <= 28) {
    // Young: lean into growth and momentum more
    w.growth = Math.min(0.4, w.growth + 0.05);
    w.momentum = Math.min(0.35, w.momentum + 0.05);
    w.income = Math.max(0.03, w.income - 0.05);
    w.value = Math.max(0.08, w.value - 0.03);
  }

  // ── Time horizon adjustments
  if (timeHorizon <= 3) {
    // Short horizon: value + quality matter most, don't chase momentum
    w.value = Math.min(0.4, w.value + 0.1);
    w.quality = Math.min(0.35, w.quality + 0.05);
    w.momentum = Math.max(0.02, w.momentum - 0.08);
    w.growth = Math.max(0.05, w.growth - 0.05);
  } else if (timeHorizon >= 15) {
    // Very long horizon: growth compounding is king
    w.growth = Math.min(0.45, w.growth + 0.08);
    w.momentum = Math.min(0.3, w.momentum + 0.03);
    w.value = Math.max(0.08, w.value - 0.06);
    w.income = Math.max(0.03, w.income - 0.04);
  }

  // ── Goal adjustments
  if (goal === "retirement") {
    w.income = Math.min(0.35, w.income + 0.08);
    w.quality = Math.min(0.35, w.quality + 0.04);
    w.momentum = Math.max(0.03, w.momentum - 0.05);
  } else if (goal === "wealth_creation") {
    w.growth = Math.min(0.45, w.growth + 0.07);
    w.momentum = Math.min(0.3, w.momentum + 0.03);
    w.income = Math.max(0.03, w.income - 0.05);
  } else if (goal === "home_purchase") {
    // Capital preservation + value — don't want volatile names
    w.value = Math.min(0.4, w.value + 0.08);
    w.quality = Math.min(0.35, w.quality + 0.05);
    w.momentum = Math.max(0.02, w.momentum - 0.08);
    w.growth = Math.max(0.05, w.growth - 0.05);
  } else if (goal === "child_education") {
    // Balanced with slight growth tilt
    w.quality = Math.min(0.3, w.quality + 0.05);
    w.growth = Math.min(0.35, w.growth + 0.03);
    w.momentum = Math.max(0.03, w.momentum - 0.03);
  } else if (goal === "emergency_corpus") {
    // Max safety — quality and value dominate
    w.quality = Math.min(0.45, w.quality + 0.15);
    w.value = Math.min(0.35, w.value + 0.1);
    w.income = Math.min(0.25, w.income + 0.05);
    w.growth = Math.max(0.03, w.growth - 0.15);
    w.momentum = Math.max(0.01, w.momentum - 0.1);
  }

  // ── Income stability adjustments
  if (incomeStability === "freelance") {
    // Variable income — prefer quality and value, avoid speculative momentum plays
    w.quality = Math.min(0.35, w.quality + 0.05);
    w.value = Math.min(0.35, w.value + 0.03);
    w.momentum = Math.max(0.02, w.momentum - 0.05);
    w.growth = Math.max(0.05, w.growth - 0.03);
  } else if (incomeStability === "salaried") {
    // Stable income — can hold through volatility, slight growth boost
    w.growth = Math.min(0.4, w.growth + 0.02);
  }

  // ── Debt-to-income adjustments
  if (debtToIncome > 0.35) {
    // High debt burden — must be conservative in stock picks too
    w.quality = Math.min(0.4, w.quality + 0.08);
    w.value = Math.min(0.35, w.value + 0.05);
    w.momentum = Math.max(0.02, w.momentum - 0.07);
    w.growth = Math.max(0.05, w.growth - 0.05);
  } else if (debtToIncome < 0.1) {
    // Very low debt — can absorb more risk
    w.growth = Math.min(0.4, w.growth + 0.03);
    w.momentum = Math.min(0.3, w.momentum + 0.02);
  }

  // ── Psychometric override (emotional risk tolerance)
  if (psychometricScore < 30) {
    // Very risk-averse regardless of bucket — pull back hard
    w.quality = Math.min(0.45, w.quality + 0.1);
    w.income = Math.min(0.35, w.income + 0.05);
    w.momentum = Math.max(0.01, w.momentum - 0.1);
    w.growth = Math.max(0.05, w.growth - 0.08);
    w.value = Math.min(0.35, w.value + 0.03);
  } else if (psychometricScore > 80) {
    // Emotionally comfortable with risk — lean into momentum + growth
    w.growth = Math.min(0.42, w.growth + 0.04);
    w.momentum = Math.min(0.32, w.momentum + 0.04);
    w.income = Math.max(0.03, w.income - 0.04);
    w.quality = Math.max(0.08, w.quality - 0.03);
  }

  // ── Normalise so weights always sum to 1.0
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  Object.keys(w).forEach((k) => (w[k] = parseFloat((w[k] / total).toFixed(4))));

  return w;
}

// ─── AI STOCK SCORER ──────────────────────────────────────────────────────────
function scoreStock(stock, liveQuote, bucket, userContext = {}) {
  const f = { ...STOCK_FUNDAMENTALS[stock.symbol] };
  if (!f) return null;

  // Use personalised weights instead of static bucket weights
  const weights = buildPersonalisedWeights(bucket, userContext);
  const sectorPE = SECTOR_PE_MEDIAN[stock.sector] || 25;
  const reasons = [];
  const factors = {};

  // Goal-based sector affinity multiplier (1.0 = neutral, >1 = boost)
  const goalAffinities = GOAL_SECTOR_AFFINITY[userContext.goal] || {};
  const sectorBoost = goalAffinities[stock.sector] || 1.0;

  // 1. VALUE SCORE
  let valueScore = 50;
  const peDiscount = ((sectorPE - f.pe) / sectorPE) * 100;
  if (peDiscount > 30) {
    valueScore = 95;
    reasons.push(
      `deeply undervalued vs sector (PE ${f.pe}x vs sector ${sectorPE}x)`,
    );
  } else if (peDiscount > 15) {
    valueScore = 78;
    reasons.push(`attractively priced vs sector (PE ${f.pe}x)`);
  } else if (peDiscount > 0) {
    valueScore = 62;
    reasons.push(`fairly valued (PE ${f.pe}x near sector median)`);
  } else if (peDiscount > -20) {
    valueScore = 42;
    reasons.push(`slight premium to sector (PE ${f.pe}x)`);
  } else {
    valueScore = 22;
    reasons.push(`premium valuation (PE ${f.pe}x vs sector ${sectorPE}x)`);
  }
  if (f.pb < 1.5) valueScore = Math.min(100, valueScore + 8);
  factors.value = valueScore;

  // 2. QUALITY SCORE
  let qualityScore = 50;
  if (f.roe >= 25) qualityScore += 30;
  else if (f.roe >= 18) qualityScore += 18;
  else if (f.roe >= 12) qualityScore += 8;
  else qualityScore -= 10;

  if (f.debtToEquity === 0) {
    qualityScore += 20;
    reasons.push("zero debt");
  } else if (f.debtToEquity < 0.3) {
    qualityScore += 12;
    reasons.push("low debt");
  } else if (f.debtToEquity > 1.5) {
    qualityScore -= 15;
    reasons.push("high leverage");
  }

  if (f.eps > 0) qualityScore += 5;
  factors.quality = Math.max(0, Math.min(100, qualityScore));

  // 3. GROWTH SCORE
  let growthScore = 50;
  const avgGrowth = ((f.revenueGrowthYoY || 0) + (f.patGrowthYoY || 0)) / 2;
  if (avgGrowth >= 40) {
    growthScore = 95;
    reasons.push(`strong earnings growth (PAT +${f.patGrowthYoY}% YoY)`);
  } else if (avgGrowth >= 20) {
    growthScore = 78;
    reasons.push(`healthy growth (PAT +${f.patGrowthYoY}% YoY)`);
  } else if (avgGrowth >= 10) {
    growthScore = 60;
    reasons.push(`moderate growth (+${f.patGrowthYoY}% PAT)`);
  } else if (avgGrowth >= 0) {
    growthScore = 42;
  } else {
    growthScore = 20;
    reasons.push("declining earnings");
  }
  factors.growth = growthScore;

  // 4. MOMENTUM SCORE
  let momentumScore = 50;
  if (
    liveQuote &&
    liveQuote.ltp &&
    liveQuote["52WeekHigh"] &&
    liveQuote["52WeekHigh"] > 0
  ) {
    const fromHigh =
      ((liveQuote.ltp - liveQuote["52WeekHigh"]) / liveQuote["52WeekHigh"]) *
      100;
    if (fromHigh > -5) {
      momentumScore = 85;
      reasons.push("near 52W high — strong momentum");
    } else if (fromHigh > -15) {
      momentumScore = 68;
    } else if (fromHigh > -25) {
      momentumScore = 50;
    } else if (fromHigh > -35) {
      momentumScore = 35;
      reasons.push(`${Math.abs(fromHigh).toFixed(0)}% below 52W high`);
    } else {
      momentumScore = 18;
      reasons.push("deep drawdown from highs");
    }

    if (liveQuote.percentChange > 1.5)
      momentumScore = Math.min(100, momentumScore + 8);
    if (liveQuote.percentChange < -2)
      momentumScore = Math.max(0, momentumScore - 8);
  }
  factors.momentum = momentumScore;

  // 5. INCOME SCORE
  let incomeScore = 50;
  if (f.dividendYield >= 4) {
    incomeScore = 95;
    reasons.push(`high dividend yield (${f.dividendYield}%)`);
  } else if (f.dividendYield >= 2) {
    incomeScore = 75;
    reasons.push(`decent dividend (${f.dividendYield}%)`);
  } else if (f.dividendYield >= 1) {
    incomeScore = 55;
  } else {
    incomeScore = 30;
  }
  factors.income = incomeScore;

  // 6. RISK-FIT SCORE — now uses userContext for finer matching
  let riskFitScore = 50;
  const isLowVolatility =
    f.debtToEquity < 0.3 && f.dividendYield > 1 && f.pe < sectorPE;
  const isHighGrowth = f.patGrowthYoY > 25 && f.pe > sectorPE;
  const isDefensive =
    f.debtToEquity === 0 && f.dividendYield >= 2 && f.roe >= 15;

  const age = userContext.age || 35;
  const goal = userContext.goal || "wealth_creation";
  const horizon = userContext.timeHorizon || 10;

  if (
    ["conservative", "mod_conservative"].includes(bucket) &&
    isLowVolatility
  ) {
    riskFitScore = 88;
    reasons.push("low-volatility profile suits conservative allocation");
  } else if (
    ["aggressive", "very_aggressive"].includes(bucket) &&
    isHighGrowth
  ) {
    riskFitScore = 88;
    reasons.push("high-growth profile suits aggressive allocation");
  } else if (bucket === "mod_aggressive") {
    riskFitScore = 65;
  }

  // Extra risk-fit boosts from user profile
  if (age >= 50 && isDefensive) {
    riskFitScore = Math.min(100, riskFitScore + 12);
    reasons.push("defensive profile suits age 50+");
  }
  if (goal === "retirement" && f.dividendYield >= 2) {
    riskFitScore = Math.min(100, riskFitScore + 8);
  }
  if (goal === "home_purchase" && horizon <= 5 && isLowVolatility) {
    riskFitScore = Math.min(100, riskFitScore + 10);
  }
  if (goal === "wealth_creation" && isHighGrowth) {
    riskFitScore = Math.min(100, riskFitScore + 8);
  }
  if (userContext.incomeStability === "freelance" && isDefensive) {
    riskFitScore = Math.min(100, riskFitScore + 8);
  }

  factors.riskFit = riskFitScore;

  // ── WEIGHTED TOTAL SCORE (personalised weights)
  let totalScore = Math.round(
    factors.value * weights.value +
      factors.quality * weights.quality +
      factors.growth * weights.growth +
      factors.momentum * weights.momentum +
      factors.income * weights.income +
      factors.riskFit * weights.riskFit,
  );

  // ── Apply goal-sector affinity boost (max +8 points)
  if (sectorBoost > 1.0) {
    const boost = Math.round((sectorBoost - 1.0) * 40); // e.g. 1.2 → +8
    totalScore = Math.min(100, totalScore + boost);
    reasons.push(
      `${stock.sector} aligns with your ${goal.replace(/_/g, " ")} goal`,
    );
  }

  totalScore = Math.max(0, Math.min(100, totalScore));

  // ── CONVICTION LABEL
  let conviction, convictionColor;
  if (totalScore >= 75) {
    conviction = "Strong Buy";
    convictionColor = "#00e5a0";
  } else if (totalScore >= 62) {
    conviction = "Buy";
    convictionColor = "#4fa6ff";
  } else if (totalScore >= 48) {
    conviction = "Hold";
    convictionColor = "#ffd166";
  } else {
    conviction = "Avoid";
    convictionColor = "#ff5f5f";
  }

  const topReasons = reasons.slice(0, 3);
  const reasoning = buildReasoning(
    stock,
    f,
    liveQuote,
    totalScore,
    conviction,
    topReasons,
    bucket,
    userContext,
  );

  return {
    ...stock,
    ltp: liveQuote?.ltp ?? null,
    change: liveQuote?.netChange ?? null,
    pChange: liveQuote?.percentChange ?? null,
    weekHigh52: liveQuote?.["52WeekHigh"] ?? null,
    weekLow52: liveQuote?.["52WeekLow"] ?? null,
    fundamentals: f,
    aiScore: totalScore,
    conviction,
    convictionColor,
    factors,
    weights, // expose personalised weights for UI transparency
    reasoning,
    highlights: topReasons,
    sectorBoost: sectorBoost > 1.0 ? sectorBoost : null,
  };
}

function buildReasoning(
  stock,
  f,
  quote,
  score,
  conviction,
  reasons,
  bucket,
  userContext = {},
) {
  const bucketLabel = {
    conservative: "conservative",
    mod_conservative: "moderate conservative",
    mod_aggressive: "moderate aggressive",
    aggressive: "aggressive",
    very_aggressive: "very aggressive",
  }[bucket];

  const goal = userContext.goal?.replace(/_/g, " ") || "wealth creation";
  const age = userContext.age || 35;
  const horizon = userContext.timeHorizon || 10;

  const priceStr = quote?.ltp
    ? `Currently trading at ₹${quote.ltp.toLocaleString("en-IN")}` +
      (quote.percentChange
        ? ` (${quote.percentChange > 0 ? "+" : ""}${
            quote.percentChange
          }% today)`
        : "")
    : "";

  const reasonStr =
    reasons.length > 0 ? reasons.join(", ") : "mixed fundamentals";
  const growthStr =
    f.patGrowthYoY > 0
      ? `PAT grew ${f.patGrowthYoY}% YoY`
      : `PAT declined ${Math.abs(f.patGrowthYoY)}% YoY`;
  const debtStr =
    f.debtToEquity === 0
      ? "debt-free balance sheet"
      : `D/E of ${f.debtToEquity}x`;

  // Personalised rationale sentence
  const personalStr =
    age >= 55
      ? `Dividend yield of ${f.dividendYield}% and low volatility suit your near-retirement profile.`
      : goal.includes("retirement")
      ? `Strong cash flows and dividend history align with your retirement goal.`
      : goal.includes("home")
      ? `Capital preservation focus suits your ${horizon}yr home purchase horizon.`
      : goal.includes("wealth")
      ? `High growth trajectory suits your wealth creation objective.`
      : goal.includes("education")
      ? `Predictable earnings suit your ${horizon}yr education corpus goal.`
      : `Suitable for a ${bucketLabel} investor with a ${horizon}-year horizon.`;

  return (
    `${conviction} — AI Score ${score}/100. ` +
    `${priceStr ? priceStr + ". " : ""}` +
    `Key factors: ${reasonStr}. ` +
    `${growthStr} with ROE of ${f.roe}% and ${debtStr}. ` +
    `P/E ${f.pe}x · EPS ₹${f.eps} · Div yield ${f.dividendYield}%. ` +
    personalStr
  );
}

// ─── PORTFOLIO WEIGHT ALLOCATOR ───────────────────────────────────────────────
function allocatePortfolioWeights(stocks, equityCorpus, capGroup) {
  if (!stocks.length || !equityCorpus) return stocks;
  const scoreSquares = stocks.map((s) => Math.pow(s.aiScore, 2));
  const totalSqScore = scoreSquares.reduce((a, b) => a + b, 0);
  return stocks.map((stock, i) => {
    const weightPct =
      totalSqScore > 0
        ? (scoreSquares[i] / totalSqScore) * 100
        : 100 / stocks.length;
    const rupeeAmount = Math.round((weightPct / 100) * equityCorpus);
    const shares =
      stock.ltp && stock.ltp > 0 ? Math.floor(rupeeAmount / stock.ltp) : null;
    return {
      ...stock,
      portfolioWeight: parseFloat(weightPct.toFixed(2)),
      allocatedAmount: rupeeAmount,
      suggestedShares: shares,
      capGroup,
    };
  });
}

// ─── LAYER 1: RISK SCORING ────────────────────────────────────────────────────
function calculateRiskScore(profile) {
  const {
    age,
    timeHorizon,
    incomeStability,
    debtToIncome,
    psychometricScore,
    emergencyFundMonths,
  } = profile;
  let score = 0;
  const ageScore =
    age < 25 ? 100 : age < 35 ? 85 : age < 45 ? 65 : age < 55 ? 40 : 20;
  score += ageScore * 0.25;
  const horizonScore =
    timeHorizon >= 15
      ? 100
      : timeHorizon >= 10
      ? 80
      : timeHorizon >= 7
      ? 65
      : timeHorizon >= 5
      ? 50
      : timeHorizon >= 3
      ? 30
      : 10;
  score += horizonScore * 0.2;
  const stabilityScore =
    incomeStability === "salaried"
      ? 80
      : incomeStability === "business"
      ? 50
      : 40;
  score += stabilityScore * 0.15;
  const liabilityScore =
    debtToIncome < 0.1
      ? 100
      : debtToIncome < 0.2
      ? 80
      : debtToIncome < 0.3
      ? 60
      : debtToIncome < 0.4
      ? 40
      : 10;
  score += liabilityScore * 0.1;
  score += (psychometricScore || 50) * 0.2;
  const emergencyScore =
    emergencyFundMonths >= 6
      ? 100
      : emergencyFundMonths >= 3
      ? 60
      : emergencyFundMonths >= 1
      ? 30
      : 0;
  score += emergencyScore * 0.1;
  return Math.round(score);
}

function getRiskBucket(score, profile) {
  let bucket;
  if (score <= 30) bucket = "conservative";
  else if (score <= 55) bucket = "mod_conservative";
  else if (score <= 70) bucket = "mod_aggressive";
  else if (score <= 85) bucket = "aggressive";
  else bucket = "very_aggressive";
  if (profile.age > 55) bucket = capBucket(bucket, "mod_conservative");
  if (profile.emergencyFundMonths < 1) bucket = downgradeBucket(bucket);
  if (profile.debtToIncome > 0.4) bucket = downgradeBucket(bucket);
  if (profile.timeHorizon < 3) bucket = capBucket(bucket, "mod_conservative");
  return bucket;
}

const BUCKET_ORDER = [
  "conservative",
  "mod_conservative",
  "mod_aggressive",
  "aggressive",
  "very_aggressive",
];
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
  conservative: { equity: 20, debt: 60, gold: 10, cash: 10 },
  mod_conservative: { equity: 40, debt: 45, gold: 10, cash: 5 },
  mod_aggressive: { equity: 60, debt: 30, gold: 7, cash: 3 },
  aggressive: { equity: 75, debt: 18, gold: 5, cash: 2 },
  very_aggressive: { equity: 85, debt: 10, gold: 5, cash: 0 },
};

function applyGoalOverlay(allocation, goal, timeHorizon) {
  const result = { ...allocation };
  if (goal === "retirement" && timeHorizon >= 15) {
    result.equity = Math.min(90, result.equity + 5);
    result.debt = Math.max(5, result.debt - 5);
  } else if (
    goal === "child_education" &&
    timeHorizon >= 7 &&
    timeHorizon <= 10
  ) {
    result.gold = Math.min(15, result.gold + 5);
    result.equity = Math.min(65, result.equity);
    result.debt = 100 - result.equity - result.gold - result.cash;
  } else if (goal === "home_purchase" && timeHorizon < 5) {
    result.equity = Math.min(30, result.equity);
    result.debt = 100 - result.equity - result.gold - result.cash;
  } else if (goal === "emergency_corpus") {
    return { equity: 0, debt: 0, gold: 0, cash: 100 };
  }
  const total = result.equity + result.debt + result.gold + result.cash;
  if (total !== 100) result.debt += 100 - total;
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
    signals.push({
      type: "warning",
      message: `Nifty P/E at ${niftyPE}x — elevated valuations. SIP preferred over lumpsum.`,
    });
  } else if (niftyPE < 18) {
    result.equity = Math.min(result.equity + 5, 90);
    result.cash = Math.max(result.cash - 5, 0);
    signals.push({
      type: "bullish",
      message: `Nifty P/E at ${niftyPE}x — attractive valuations. Potential accumulation zone.`,
    });
  } else {
    signals.push({
      type: "neutral",
      message: `Nifty P/E at ${niftyPE}x — markets fairly valued. Continue SIPs.`,
    });
  }
  if (marketData.niftyDrawdown && marketData.niftyDrawdown < -10) {
    signals.push({
      type: "opportunity",
      message: `Nifty is ${Math.abs(marketData.niftyDrawdown).toFixed(
        1,
      )}% below ATH — consider increasing equity SIP.`,
    });
  }
  return { allocation: result, signals };
}

// ─── LAYER 2B: EQUITY SUB-ALLOCATION ─────────────────────────────────────────
const EQUITY_SUB_ALLOCATION = {
  conservative: { large: 80, mid: 15, small: 5, intl: 0 },
  mod_conservative: { large: 65, mid: 25, small: 10, intl: 0 },
  mod_aggressive: { large: 50, mid: 30, small: 15, intl: 5 },
  aggressive: { large: 35, mid: 35, small: 20, intl: 10 },
  very_aggressive: { large: 25, mid: 35, small: 25, intl: 15 },
};

/**
 * screenAndScoreStocks — now accepts userContext for personalised scoring.
 * Each user's stock shortlist and ranking will differ based on their
 * age, goal, time horizon, income stability, debt burden, and psychometric score.
 */
function screenAndScoreStocks(
  stocksWithLiveData,
  bucket,
  equityCorpus,
  existingHoldings = [],
  recentSells = [],
  userContext = {},
) {
  const existingSymbols = new Set(
    (existingHoldings || []).map((h) => h.tradingsymbol),
  );
  const recentSellSymbols = new Set(
    (recentSells || []).map((o) => o.tradingsymbol),
  );
  const subAlloc = EQUITY_SUB_ALLOCATION[bucket];
  const sectorCount = {};

  const scoredByGroup = { large: [], mid: [], small: [] };
  const maxPerGroup = { large: 12, mid: 8, small: 5 };

  for (const [capGroup, stocks] of Object.entries(stocksWithLiveData)) {
    const capKey = capGroup.replace("_cap", "");
    if (!scoredByGroup[capKey]) continue;

    for (const stock of stocks) {
      if (existingSymbols.has(stock.symbol)) continue;
      if (recentSellSymbols.has(stock.symbol)) continue;

      const f = STOCK_FUNDAMENTALS[stock.symbol];
      if (!f) continue;

      // Hard fundamental filters
      if (f.debtToEquity > 2) continue;
      if (f.eps <= 0) continue;
      if (f.pe < 0) continue;

      // Liquidity filter
      if (stock.avgVolumeCr !== undefined && stock.avgVolumeCr < 5) continue;

      // Sector concentration cap
      const sector = stock.sector;
      sectorCount[sector] = (sectorCount[sector] || 0) + 1;
      if (sectorCount[sector] > 3) continue; // max 3 stocks per sector across all groups

      // AI SCORE — pass userContext for personalised scoring
      const scored = scoreStock(stock, stock.liveQuote, bucket, userContext);
      if (!scored) continue;

      scoredByGroup[capKey].push(scored);
    }

    // Sort by AI score descending, take top N
    scoredByGroup[capKey].sort((a, b) => b.aiScore - a.aiScore);
    scoredByGroup[capKey] = scoredByGroup[capKey].slice(0, maxPerGroup[capKey]);
  }

  const largePct = subAlloc.large / 100;
  const midPct = subAlloc.mid / 100;
  const smallPct = subAlloc.small / 100;

  return {
    large: allocatePortfolioWeights(
      scoredByGroup.large,
      equityCorpus * largePct,
      "Large Cap",
    ),
    mid: allocatePortfolioWeights(
      scoredByGroup.mid,
      equityCorpus * midPct,
      "Mid Cap",
    ),
    small: allocatePortfolioWeights(
      scoredByGroup.small,
      equityCorpus * smallPct,
      "Small Cap",
    ),
    summary: {
      totalStocks:
        scoredByGroup.large.length +
        scoredByGroup.mid.length +
        scoredByGroup.small.length,
      avgScore: avgScore([
        ...scoredByGroup.large,
        ...scoredByGroup.mid,
        ...scoredByGroup.small,
      ]),
      strongBuys: countByConviction(
        [...scoredByGroup.large, ...scoredByGroup.mid, ...scoredByGroup.small],
        "Strong Buy",
      ),
      buys: countByConviction(
        [...scoredByGroup.large, ...scoredByGroup.mid, ...scoredByGroup.small],
        "Buy",
      ),
      equityCorpus,
      // Surface what drove this user's personalised weights
      userWeightProfile: buildPersonalisedWeights(bucket, userContext),
    },
  };
}

function avgScore(stocks) {
  if (!stocks.length) return 0;
  return Math.round(
    stocks.reduce((s, st) => s + st.aiScore, 0) / stocks.length,
  );
}
function countByConviction(stocks, label) {
  return stocks.filter((s) => s.conviction === label).length;
}

// Legacy compatibility
function screenStocks(
  stocksWithFundamentals,
  bucket,
  existingHoldings = [],
  recentSells = [],
) {
  return screenAndScoreStocks(
    stocksWithFundamentals,
    bucket,
    0,
    existingHoldings,
    recentSells,
    {},
  );
}

// ─── LAYER 2C: DEBT SUB-ALLOCATION ───────────────────────────────────────────
function getDebtSubAllocation(timeHorizon) {
  if (timeHorizon < 1)
    return { liquid: 100, shortDuration: 0, corporateBond: 0, dynamicBond: 0 };
  else if (timeHorizon < 3)
    return { liquid: 20, shortDuration: 80, corporateBond: 0, dynamicBond: 0 };
  else if (timeHorizon < 7)
    return {
      liquid: 10,
      shortDuration: 30,
      corporateBond: 40,
      dynamicBond: 20,
    };
  else
    return { liquid: 5, shortDuration: 10, corporateBond: 30, dynamicBond: 55 };
}

// ─── LAYER 2D: MF CATEGORY SELECTION ─────────────────────────────────────────
function selectMFCategories(bucket, allocation, timeHorizon, investableCorpus) {
  const categories = [];
  const subAlloc = EQUITY_SUB_ALLOCATION[bucket];
  const debtSplit = getDebtSubAllocation(timeHorizon);

  if (allocation.equity > 0) {
    if (subAlloc.large >= 50) categories.push("large_cap_index");
    if (subAlloc.large < 50 || bucket === "mod_aggressive")
      categories.push("flexi_cap");
    if (subAlloc.mid >= 25) categories.push("mid_cap");
    if (subAlloc.small >= 15) categories.push("small_cap");
    if (["conservative", "mod_conservative"].includes(bucket))
      categories.push("balanced_advantage");
    if (["mod_conservative", "mod_aggressive"].includes(bucket))
      categories.push("multi_asset");
    if (subAlloc.large >= 35 && subAlloc.mid >= 25)
      categories.push("large_mid_cap");
  }
  if (allocation.debt > 0) {
    if (debtSplit.liquid > 0) categories.push("liquid");
    if (debtSplit.shortDuration > 0) categories.push("short_duration");
    if (debtSplit.dynamicBond > 0) categories.push("dynamic_bond");
    if (timeHorizon >= 3) categories.push("banking_psu");
  }
  if (allocation.gold > 0) categories.push("gold_etf");
  return [...new Set(categories)];
}

// ─── PORTFOLIO PROJECTION ─────────────────────────────────────────────────────
const EXPECTED_RETURNS = {
  equity: { conservative: 10, base: 13, optimistic: 16 },
  debt: { conservative: 6, base: 7.5, optimistic: 9 },
  gold: { conservative: 6, base: 8, optimistic: 11 },
  cash: { conservative: 5, base: 6, optimistic: 7 },
};

function projectPortfolio(lumpsum, monthlySIP, timeHorizon, allocation) {
  const scenarios = {};
  for (const scenario of ["conservative", "base", "optimistic"]) {
    const blendedReturn =
      ((allocation.equity / 100) * EXPECTED_RETURNS.equity[scenario] +
        (allocation.debt / 100) * EXPECTED_RETURNS.debt[scenario] +
        (allocation.gold / 100) * EXPECTED_RETURNS.gold[scenario] +
        (allocation.cash / 100) * EXPECTED_RETURNS.cash[scenario]) /
      100;
    const r = blendedReturn / 12;
    const n = timeHorizon * 12;
    const lumpsumFV = lumpsum * Math.pow(1 + blendedReturn, timeHorizon);
    const sipFV = monthlySIP * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
    scenarios[scenario] = {
      totalInvested: lumpsum + monthlySIP * n,
      futureValue: Math.round(lumpsumFV + sipFV),
      blendedCAGR: (blendedReturn * 100).toFixed(1),
      wealthGain: Math.round(lumpsumFV + sipFV - lumpsum - monthlySIP * n),
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
        action: current > target ? "reduce" : "increase",
      });
    }
  }
  return alerts;
}

// ─── PSYCHOMETRIC ─────────────────────────────────────────────────────────────
function scorePsychometric(answers) {
  if (!answers || answers.length === 0) return 50;
  return Math.round(
    answers.reduce((sum, a) => sum + (a.score || 50), 0) / answers.length,
  );
}

const PSYCHOMETRIC_QUESTIONS = [
  {
    id: "q1",
    question: "If your portfolio dropped 20% in one month, what would you do?",
    options: [
      { label: "Buy more — great opportunity", score: 100 },
      { label: "Hold — it will recover", score: 70 },
      { label: "Sell some to reduce risk", score: 35 },
      { label: "Sell all — preserve capital", score: 0 },
    ],
  },
  {
    id: "q2",
    question: "Your ₹10L portfolio drops to ₹7L temporarily. How do you feel?",
    options: [
      { label: "Fine, markets recover long-term", score: 100 },
      { label: "Uncomfortable but I'll hold", score: 65 },
      { label: "Very stressed, considering exit", score: 30 },
      { label: "Cannot handle this loss", score: 0 },
    ],
  },
  {
    id: "q3",
    question: "What is more important to you?",
    options: [
      { label: "Growing wealth aggressively", score: 100 },
      { label: "Balance of growth and safety", score: 65 },
      { label: "Preserving what I have", score: 25 },
      { label: "Not losing money at all", score: 0 },
    ],
  },
  {
    id: "q4",
    question: "How long can you leave money invested without needing it?",
    options: [
      { label: "10+ years easily", score: 100 },
      { label: "5–10 years", score: 75 },
      { label: "3–5 years", score: 45 },
      { label: "Less than 3 years", score: 15 },
    ],
  },
  {
    id: "q5",
    question: "Have you ever exited an investment at a loss?",
    options: [
      { label: "Never — I always hold through downturns", score: 90 },
      { label: "Once, but regretted it", score: 60 },
      { label: "Yes, when losses were too painful", score: 25 },
      { label: "Yes, multiple times", score: 0 },
    ],
  },
  {
    id: "q6",
    question: "Which investment would you choose?",
    options: [
      { label: "Potential 20% return with risk of -8%", score: 100 },
      { label: "Potential 15% return with risk of -5%", score: 70 },
      { label: "Potential 10% return with risk of -2%", score: 35 },
      { label: "Guaranteed 7% return, no downside", score: 0 },
    ],
  },
];

module.exports = {
  calculateRiskScore,
  getRiskBucket,
  BASE_ALLOCATION,
  applyGoalOverlay,
  applyTacticalOverlay,
  EQUITY_SUB_ALLOCATION,
  screenStocks,
  screenAndScoreStocks,
  scoreStock,
  allocatePortfolioWeights,
  getDebtSubAllocation,
  selectMFCategories,
  projectPortfolio,
  checkRebalancingNeeded,
  scorePsychometric,
  PSYCHOMETRIC_QUESTIONS,
  STOCK_UNIVERSE,
  STOCK_FUNDAMENTALS,
  BUCKET_ORDER,
  buildPersonalisedWeights,
};
