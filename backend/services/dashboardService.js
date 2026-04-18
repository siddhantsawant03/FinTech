// const axios = require('axios');

// const SMARTAPI_BASE = 'https://apiconnect.angelone.in';

// // Angel One SmartAPI token symbol IDs for indices
// const INDEX_TOKENS = {
//   NIFTY: { token: '99926000', exchange: 'NSE', name: 'NIFTY 50' },
//   SENSEX: { token: '99919000', exchange: 'BSE', name: 'SENSEX' },
//   BANKNIFTY: { token: '99926009', exchange: 'NSE', name: 'BANK NIFTY' },
//   NIFTYMIDCAP: { token: '99926011', exchange: 'NSE', name: 'NIFTY MIDCAP 100' },
// };

// /**
//  * Helper: build SmartAPI auth headers
//  */
// function smartHeaders(jwtToken) {
//   return {
//     Authorization: `Bearer ${jwtToken}`,
//     'Content-Type': 'application/json',
//     Accept: 'application/json',
//     'X-UserType': 'USER',
//     'X-SourceID': 'WEB',
//     'X-ClientLocalIP': '127.0.0.1',
//     'X-ClientPublicIP': '127.0.0.1',
//     'X-MACAddress': '00:00:00:00:00:00',
//     'X-PrivateKey': process.env.ANGEL_API_KEY,
//   };
// }

// /**
//  * Fetch live LTP quote for index tokens
//  */
// async function getIndexQuotes(jwtToken) {
//   try {
//     const payload = {
//       mode: 'LTP',
//       exchangeTokens: {
//         NSE: [INDEX_TOKENS.NIFTY.token, INDEX_TOKENS.BANKNIFTY.token, INDEX_TOKENS.NIFTYMIDCAP.token],
//         BSE: [INDEX_TOKENS.SENSEX.token],
//       },
//     };
//     const res = await axios.post(`${SMARTAPI_BASE}/rest/secure/angelbroking/market/v1/quote/`, payload, {
//       headers: smartHeaders(jwtToken),
//     });
//     return res.data?.data?.fetched || [];
//   } catch (err) {
//     console.error('[dashboardService] getIndexQuotes error:', err.message);
//     return [];
//   }
// }

// /**
//  * Fetch FII/DII data from NSE India (public endpoint, no auth needed)
//  */
// async function getFIIDIIData() {
//   try {
//     const res = await axios.get('https://www.nseindia.com/api/fiidiiTradeReact', {
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//         Accept: 'application/json',
//         Referer: 'https://www.nseindia.com/',
//       },
//       timeout: 8000,
//     });

//     const raw = res.data || [];
//     // Latest entry is today
//     const today = raw[0] || {};
//     return {
//       fii: {
//         buyValue: parseFloat(today.fiiBuyValue || 0),
//         sellValue: parseFloat(today.fiiSellValue || 0),
//         netValue: parseFloat(today.fiiNetValue || 0),
//       },
//       dii: {
//         buyValue: parseFloat(today.diiBuyValue || 0),
//         sellValue: parseFloat(today.diiSellValue || 0),
//         netValue: parseFloat(today.diiNetValue || 0),
//       },
//       date: today.date || new Date().toLocaleDateString('en-IN'),
//       history: raw.slice(0, 10).map(d => ({
//         date: d.date,
//         fiiNet: parseFloat(d.fiiNetValue || 0),
//         diiNet: parseFloat(d.diiNetValue || 0),
//       })),
//     };
//   } catch (err) {
//     console.error('[dashboardService] getFIIDIIData error:', err.message);
//     return {
//       fii: { buyValue: 0, sellValue: 0, netValue: 0 },
//       dii: { buyValue: 0, sellValue: 0, netValue: 0 },
//       date: new Date().toLocaleDateString('en-IN'),
//       history: [],
//     };
//   }
// }

// /**
//  * Fetch USD/INR rate from ExchangeRate API (free tier)
//  */
// async function getUSDINR() {
//   try {
//     const res = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 5000 });
//     const inr = res.data?.rates?.INR;
//     return { rate: inr ? parseFloat(inr.toFixed(2)) : null, source: 'ExchangeRate-API' };
//   } catch (err) {
//     console.error('[dashboardService] getUSDINR error:', err.message);
//     return { rate: null };
//   }
// }

// /**
//  * Fetch RBI Repo Rate from RBI website (scrape public data)
//  * Falls back to hardcoded latest known value with a note
//  */
// async function getRepoRate() {
//   // RBI Repo rate – updated manually or via scraping.
//   // As of April 2025, RBI repo rate is 6.25% (cut from 6.5% in Feb 2025).
//   // For a production app, hook up a scraper or a financial data API.
//   return {
//     rate: 6.25,
//     lastUpdated: '2025-04-09',
//     note: 'Source: RBI MPC Decision',
//   };
// }

// /**
//  * Fetch Nifty 50 PE ratio from NSE India
//  */
// async function getNiftyPE() {
//   try {
//     const res = await axios.get('https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050', {
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
//         Accept: 'application/json',
//         Referer: 'https://www.nseindia.com/',
//       },
//       timeout: 8000,
//     });
//     const data = res.data?.data || [];
//     // First element is the index itself
//     const index = data.find(d => d.symbol === 'NIFTY 50') || data[0] || {};
//     return {
//       niftyPE: parseFloat(index.pe || 0).toFixed(2),
//       niftyPB: parseFloat(index.pb || 0).toFixed(2),
//       niftyDiv: parseFloat(index.divYield || 0).toFixed(2),
//     };
//   } catch (err) {
//     console.error('[dashboardService] getNiftyPE error:', err.message);
//     return { niftyPE: null, niftyPB: null, niftyDiv: null };
//   }
// }

// /**
//  * Fetch Sensex PE from BSE India
//  */
// async function getSensexPE() {
//   try {
//     const res = await axios.get('https://api.bseindia.com/BseIndiaAPI/api/GetIndexDataM/w?Scode=1&Cat=0&flag=0', {
//       headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://www.bseindia.com/' },
//       timeout: 8000,
//     });
//     const data = res.data;
//     return {
//       sensexPE: data?.PERatio ? parseFloat(data.PERatio).toFixed(2) : null,
//       sensexPB: data?.PBRatio ? parseFloat(data.PBRatio).toFixed(2) : null,
//     };
//   } catch (err) {
//     console.error('[dashboardService] getSensexPE error:', err.message);
//     return { sensexPE: null, sensexPB: null };
//   }
// }

// /**
//  * Fetch intraday candle data for an index
//  */
// async function getIndexCandles(jwtToken, symbolToken, interval = 'FIVE_MINUTE', exchange = 'NSE') {
//   try {
//     const now = new Date();
//     const from = new Date();
//     from.setHours(9, 15, 0, 0);

//     const format = d =>
//       `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

//     const payload = {
//       exchange,
//       symboltoken: symbolToken,
//       interval,
//       fromdate: format(from),
//       todate: format(now),
//     };

//     const res = await axios.post(`${SMARTAPI_BASE}/rest/secure/angelbroking/historical/v1/getCandleData`, payload, {
//       headers: smartHeaders(jwtToken),
//     });

//     const raw = res.data?.data || [];
//     return raw.map(c => ({
//       time: c[0],
//       open: c[1],
//       high: c[2],
//       low: c[3],
//       close: c[4],
//       volume: c[5],
//     }));
//   } catch (err) {
//     console.error('[dashboardService] getIndexCandles error:', err.message);
//     return [];
//   }
// }

// /**
//  * Market breadth from NSE
//  */
// async function getMarketBreadth() {
//   try {
//     const res = await axios.get('https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%2050', {
//       headers: {
//         'User-Agent': 'Mozilla/5.0',
//         Accept: 'application/json',
//         Referer: 'https://www.nseindia.com/',
//       },
//       timeout: 8000,
//     });
//     const data = res.data?.data || [];
//     let advances = 0, declines = 0, unchanged = 0;
//     data.forEach(s => {
//       if (s.pChange > 0) advances++;
//       else if (s.pChange < 0) declines++;
//       else unchanged++;
//     });
//     return { advances, declines, unchanged, total: data.length };
//   } catch (err) {
//     console.error('[dashboardService] getMarketBreadth error:', err.message);
//     return { advances: 0, declines: 0, unchanged: 0, total: 0 };
//   }
// }

// /**
//  * Master function: fetch all data in parallel
//  */
// async function getAllMarketData(jwtToken) {
//   const [quotes, fiiDii, usdInr, repoRate, niftyPE, sensexPE, breadth] = await Promise.allSettled([
//     getIndexQuotes(jwtToken),
//     getFIIDIIData(),
//     getUSDINR(),
//     getRepoRate(),
//     getNiftyPE(),
//     getSensexPE(),
//     getMarketBreadth(),
//   ]);

//   const quotesData = quotes.status === 'fulfilled' ? quotes.value : [];

//   // Parse index quotes by token
//   const findQuote = token => quotesData.find(q => q.symbolToken === token) || {};

//   const niftyQ = findQuote(INDEX_TOKENS.NIFTY.token);
//   const sensexQ = findQuote(INDEX_TOKENS.SENSEX.token);
//   const bankNiftyQ = findQuote(INDEX_TOKENS.BANKNIFTY.token);
//   const midcapQ = findQuote(INDEX_TOKENS.NIFTYMIDCAP.token);

//   return {
//     indices: {
//       nifty: {
//         ltp: niftyQ.ltp || null,
//         change: niftyQ.netChange || null,
//         pChange: niftyQ.percentChange || null,
//         high: niftyQ.high || null,
//         low: niftyQ.low || null,
//         open: niftyQ.open || null,
//         close: niftyQ.close || null,
//         ...(niftyPE.status === 'fulfilled' ? niftyPE.value : {}),
//       },
//       sensex: {
//         ltp: sensexQ.ltp || null,
//         change: sensexQ.netChange || null,
//         pChange: sensexQ.percentChange || null,
//         high: sensexQ.high || null,
//         low: sensexQ.low || null,
//         ...(sensexPE.status === 'fulfilled' ? sensexPE.value : {}),
//       },
//       bankNifty: {
//         ltp: bankNiftyQ.ltp || null,
//         change: bankNiftyQ.netChange || null,
//         pChange: bankNiftyQ.percentChange || null,
//       },
//       niftyMidcap: {
//         ltp: midcapQ.ltp || null,
//         change: midcapQ.netChange || null,
//         pChange: midcapQ.percentChange || null,
//       },
//     },
//     fiiDii: fiiDii.status === 'fulfilled' ? fiiDii.value : {},
//     usdInr: usdInr.status === 'fulfilled' ? usdInr.value : {},
//     repoRate: repoRate.status === 'fulfilled' ? repoRate.value : {},
//     breadth: breadth.status === 'fulfilled' ? breadth.value : {},
//     marketTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
//   };
// }

// module.exports = { getAllMarketData, getIndexCandles };

const axios = require("axios");

const SMARTAPI_BASE = "https://apiconnect.angelone.in";

const INDEX_TOKENS = {
  NIFTY: { token: "99926000", exchange: "NSE" },
  SENSEX: { token: "99919000", exchange: "BSE" },
  BANKNIFTY: { token: "99926009", exchange: "NSE" },
  NIFTYMIDCAP: { token: "99926011", exchange: "NSE" },
};

// ─── SmartAPI headers ─────────────────────────────────────────────────────────
function smartHeaders(jwtToken) {
  if (!process.env.ANGEL_API_KEY) {
    console.error("[dashboardService] ❌ ANGEL_API_KEY env var is NOT set!");
  }
  return {
    Authorization: `Bearer ${jwtToken}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": "127.0.0.1",
    "X-ClientPublicIP": "127.0.0.1",
    "X-MACAddress": "00:00:00:00:00:00",
    "X-PrivateKey": process.env.ANGEL_API_KEY,
  };
}

// ─── Angel One: Index Quotes ──────────────────────────────────────────────────
async function getIndexQuotes(jwtToken) {
  try {
    const payload = {
      mode: "FULL",
      exchangeTokens: {
        NSE: [
          INDEX_TOKENS.NIFTY.token,
          INDEX_TOKENS.BANKNIFTY.token,
          INDEX_TOKENS.NIFTYMIDCAP.token,
        ],
        BSE: [INDEX_TOKENS.SENSEX.token],
      },
    };

    const res = await axios.post(
      `${SMARTAPI_BASE}/rest/secure/angelbroking/market/v1/quote/`,
      payload,
      { headers: smartHeaders(jwtToken), timeout: 10000 },
    );

    const fetched = res.data?.data?.fetched || [];
    console.log(
      "[dashboardService] Quote status:",
      res.data?.status,
      "| Count:",
      fetched.length,
    );
    if (fetched.length > 0) {
      console.log(
        "[dashboardService] First quote fields:",
        JSON.stringify(fetched[0]),
      );
    } else {
      console.error(
        "[dashboardService] ❌ Empty quotes. Full response:",
        JSON.stringify(res.data),
      );
    }
    return fetched;
  } catch (err) {
    const errData = err?.response?.data;
    console.error(
      "[dashboardService] getIndexQuotes error:",
      errData || err.message,
    );
    if (errData?.errorcode) {
      console.error(
        "[dashboardService] Angel One error code:",
        errData.errorcode,
        errData.message,
      );
    }
    return [];
  }
}

// ─── FII / DII ────────────────────────────────────────────────────────────────
async function getFIIDIIData() {
  // Source 1: Moneycontrol
  try {
    const res = await axios.get(
      "https://priceapi.moneycontrol.com/techCharts/indianMarket/fiidii",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          Accept: "application/json",
          Referer: "https://www.moneycontrol.com/",
        },
        timeout: 10000,
      },
    );
    const raw = res.data?.data || res.data || [];
    const list = Array.isArray(raw) ? raw : [];
    if (list.length > 0) {
      const today = list[0];
      const parseNum = (v) =>
        parseFloat(String(v || "0").replace(/,/g, "")) || 0;
      return {
        fii: {
          buyValue: parseNum(today.fii_buy ?? today.fiiBuyValue),
          sellValue: parseNum(today.fii_sell ?? today.fiiSellValue),
          netValue: parseNum(today.fii_net ?? today.fiiNetValue),
        },
        dii: {
          buyValue: parseNum(today.dii_buy ?? today.diiBuyValue),
          sellValue: parseNum(today.dii_sell ?? today.diiSellValue),
          netValue: parseNum(today.dii_net ?? today.diiNetValue),
        },
        date:
          today.date ||
          today.trade_date ||
          new Date().toLocaleDateString("en-IN"),
        history: list.slice(0, 10).map((d) => ({
          date: d.date || d.trade_date,
          fiiNet:
            parseFloat(
              String(d.fii_net ?? d.fiiNetValue ?? 0).replace(/,/g, ""),
            ) || 0,
          diiNet:
            parseFloat(
              String(d.dii_net ?? d.diiNetValue ?? 0).replace(/,/g, ""),
            ) || 0,
        })),
      };
    }
  } catch (err) {
    console.error(
      "[dashboardService] getFIIDIIData source1 error:",
      err.message,
    );
  }

  // Source 2: BSE India
  try {
    const res = await axios.get(
      "https://api.bseindia.com/BseIndiaAPI/api/FIIDIIData/w",
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://www.bseindia.com/",
          Accept: "application/json",
        },
        timeout: 8000,
      },
    );
    const raw = res.data?.Table || res.data || [];
    const list = Array.isArray(raw) ? raw : [];
    if (list.length > 0) {
      const today = list[0];
      const parseNum = (v) =>
        parseFloat(String(v || "0").replace(/,/g, "")) || 0;
      return {
        fii: {
          buyValue: parseNum(today.FII_BuyValue ?? today.fiiBuyValue),
          sellValue: parseNum(today.FII_SellValue ?? today.fiiSellValue),
          netValue: parseNum(today.FII_NetValue ?? today.fiiNetValue),
        },
        dii: {
          buyValue: parseNum(today.DII_BuyValue ?? today.diiBuyValue),
          sellValue: parseNum(today.DII_SellValue ?? today.diiSellValue),
          netValue: parseNum(today.DII_NetValue ?? today.diiNetValue),
        },
        date:
          today.Date ||
          today.TradeDate ||
          new Date().toLocaleDateString("en-IN"),
        history: list.slice(0, 10).map((d) => ({
          date: d.Date || d.TradeDate,
          fiiNet:
            parseFloat(
              String(d.FII_NetValue ?? d.fiiNetValue ?? 0).replace(/,/g, ""),
            ) || 0,
          diiNet:
            parseFloat(
              String(d.DII_NetValue ?? d.diiNetValue ?? 0).replace(/,/g, ""),
            ) || 0,
        })),
      };
    }
  } catch (err) {
    console.error(
      "[dashboardService] getFIIDIIData source2 error:",
      err.message,
    );
  }

  console.warn(
    "[dashboardService] FII/DII: all sources failed, returning zeros",
  );
  return {
    fii: { buyValue: 0, sellValue: 0, netValue: 0 },
    dii: { buyValue: 0, sellValue: 0, netValue: 0 },
    date: new Date().toLocaleDateString("en-IN"),
    history: [],
    unavailable: true,
  };
}

// ─── USD / INR ────────────────────────────────────────────────────────────────
async function getUSDINR() {
  try {
    const res = await axios.get("https://open.er-api.com/v6/latest/USD", {
      timeout: 6000,
    });
    const inr = res.data?.rates?.INR;
    if (inr)
      return { rate: parseFloat(inr.toFixed(2)), source: "ExchangeRate-API" };
  } catch (_) {}

  try {
    const res = await axios.get(
      "https://api.frankfurter.app/latest?from=USD&to=INR",
      { timeout: 6000 },
    );
    const inr = res.data?.rates?.INR;
    if (inr) return { rate: parseFloat(inr.toFixed(2)), source: "Frankfurter" };
  } catch (_) {}

  return { rate: null };
}

// ─── RBI Repo Rate ────────────────────────────────────────────────────────────
async function getRepoRate() {
  return {
    rate: 6.0,
    lastUpdated: "2025-04-09",
    note: "Source: RBI MPC Decision",
  };
}

// ─── Nifty PE ─────────────────────────────────────────────────────────────────
async function getNiftyPE(jwtToken) {
  try {
    const res = await axios.get("https://api.tickertape.in/indices/NIFTY50", {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
      timeout: 8000,
    });
    const d = res.data?.data || res.data || {};
    const pe = d.pe ?? d.peRatio ?? d.PE;
    const pb = d.pb ?? d.pbRatio ?? d.PB;
    if (pe)
      return {
        niftyPE: parseFloat(pe).toFixed(2),
        niftyPB: pb ? parseFloat(pb).toFixed(2) : null,
      };
  } catch (_) {}

  return { niftyPE: null, niftyPB: null };
}

// ─── Sensex PE ────────────────────────────────────────────────────────────────
async function getSensexPE() {
  const bseUrls = [
    "https://api.bseindia.com/BseIndiaAPI/api/SensexData/w",
    "https://api.bseindia.com/BseIndiaAPI/api/getScripHeaderData/w?Scode=1&CAT=0&FLAG=sp",
  ];
  for (const url of bseUrls) {
    try {
      const res = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://www.bseindia.com/",
          Accept: "application/json",
        },
        timeout: 8000,
      });
      const d = res.data?.Table?.[0] || res.data || {};
      const pe = d.PERatio ?? d.PE_Ratio ?? d.pe;
      const pb = d.PBRatio ?? d.PB_Ratio ?? d.pb;
      if (pe)
        return {
          sensexPE: parseFloat(pe).toFixed(2),
          sensexPB: pb ? parseFloat(pb).toFixed(2) : null,
        };
    } catch (_) {}
  }
  return { sensexPE: null, sensexPB: null };
}

// ─── Intraday Candles ─────────────────────────────────────────────────────────
async function getIndexCandles(
  jwtToken,
  symbolToken,
  interval = "FIVE_MINUTE",
  exchange = "NSE",
) {
  try {
    const now = new Date();
    const from = new Date();
    from.setHours(9, 15, 0, 0);

    if (now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() < 15)) {
      from.setDate(from.getDate() - 1);
      now.setDate(now.getDate() - 1);
      now.setHours(15, 30, 0, 0);
    }

    const fmt = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate(),
      ).padStart(2, "0")} ` +
      `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes(),
      ).padStart(2, "0")}`;

    const payload = {
      exchange,
      symboltoken: symbolToken,
      interval,
      fromdate: fmt(from),
      todate: fmt(now),
    };
    console.log("[dashboardService] Candle payload:", payload);

    const res = await axios.post(
      `${SMARTAPI_BASE}/rest/secure/angelbroking/historical/v1/getCandleData`,
      payload,
      { headers: smartHeaders(jwtToken), timeout: 10000 },
    );

    const raw = res.data?.data || [];
    console.log(
      "[dashboardService] Candles received:",
      raw.length,
      "| status:",
      res.data?.status,
    );
    if (!raw.length) {
      console.error(
        "[dashboardService] ❌ No candle data. Full response:",
        JSON.stringify(res.data),
      );
    }

    return raw.map((c) => ({
      time: c[0],
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5],
    }));
  } catch (err) {
    console.error(
      "[dashboardService] getIndexCandles error:",
      err?.response?.data || err.message,
    );
    return [];
  }
}

// ─── Market Breadth — via Angel One gainers/losers ───────────────────────────
async function getMarketBreadth(jwtToken) {
  try {
    const [gainersRes, losersRes] = await Promise.all([
      axios.post(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/market/v1/gainersLosers/`,
        { datatype: "PercPriceGainers", expirytype: "NEAR" },
        { headers: smartHeaders(jwtToken), timeout: 8000 },
      ),
      axios.post(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/market/v1/gainersLosers/`,
        { datatype: "PercPriceLosers", expirytype: "NEAR" },
        { headers: smartHeaders(jwtToken), timeout: 8000 },
      ),
    ]);

    const gainers = gainersRes.data?.data?.length || 0;
    const losers = losersRes.data?.data?.length || 0;

    if (gainers || losers) {
      console.log(
        "[dashboardService] Breadth from gainers/losers: adv=%d dec=%d",
        gainers,
        losers,
      );
      return {
        advances: gainers,
        declines: losers,
        unchanged: 0,
        total: gainers + losers,
      };
    }
  } catch (err) {
    console.error(
      "[dashboardService] getMarketBreadth error:",
      err?.response?.data || err.message,
    );
  }

  // Fallback: tickertape
  try {
    const res = await axios.get(
      "https://api.tickertape.in/market-stats/breadth",
      {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
        timeout: 8000,
      },
    );
    const d = res.data?.data || res.data || {};
    return {
      advances: d.advances ?? d.advancers ?? 0,
      declines: d.declines ?? d.decliners ?? 0,
      unchanged: d.unchanged ?? d.noChange ?? 0,
      total: d.total ?? 0,
    };
  } catch (_) {}

  return { advances: 0, declines: 0, unchanged: 0, total: 0 };
}

// ─── Master function ──────────────────────────────────────────────────────────
async function getAllMarketData(jwtToken) {
  console.log("[dashboardService] Starting getAllMarketData");
  console.log(
    "[dashboardService] Token prefix:",
    jwtToken?.slice(0, 20) + "...",
  );
  console.log(
    "[dashboardService] ANGEL_API_KEY set:",
    !!process.env.ANGEL_API_KEY,
  );

  const [quotes, fiiDii, usdInr, repoRate, niftyPE, sensexPE, breadth] =
    await Promise.allSettled([
      getIndexQuotes(jwtToken),
      getFIIDIIData(),
      getUSDINR(),
      getRepoRate(),
      getNiftyPE(jwtToken),
      getSensexPE(),
      getMarketBreadth(jwtToken),
    ]);

  const quotesData = quotes.status === "fulfilled" ? quotes.value : [];

  const findQuote = (token) =>
    quotesData.find((q) => String(q.symbolToken) === String(token)) || {};

  const niftyQ = findQuote(INDEX_TOKENS.NIFTY.token);
  const sensexQ = findQuote(INDEX_TOKENS.SENSEX.token);
  const bankNiftyQ = findQuote(INDEX_TOKENS.BANKNIFTY.token);
  const midcapQ = findQuote(INDEX_TOKENS.NIFTYMIDCAP.token);

  console.log("[dashboardService] NIFTY quote:", JSON.stringify(niftyQ));
  console.log("[dashboardService] SENSEX quote:", JSON.stringify(sensexQ));

  const niftyPEVal = niftyPE.status === "fulfilled" ? niftyPE.value : {};
  const sensexPEVal = sensexPE.status === "fulfilled" ? sensexPE.value : {};

  return {
    indices: {
      nifty: {
        ltp: niftyQ.ltp ?? null,
        change: niftyQ.netChange ?? null,
        pChange: niftyQ.percentChange ?? null,
        high: niftyQ.high ?? null,
        low: niftyQ.low ?? null,
        open: niftyQ.open ?? null,
        close: niftyQ.close ?? null,
        ...niftyPEVal,
      },
      sensex: {
        ltp: sensexQ.ltp ?? null,
        change: sensexQ.netChange ?? null,
        pChange: sensexQ.percentChange ?? null,
        high: sensexQ.high ?? null,
        low: sensexQ.low ?? null,
        ...sensexPEVal,
      },
      bankNifty: {
        ltp: bankNiftyQ.ltp ?? null,
        change: bankNiftyQ.netChange ?? null,
        pChange: bankNiftyQ.percentChange ?? null,
        high: bankNiftyQ.high ?? null,
        low: bankNiftyQ.low ?? null,
      },
      niftyMidcap: {
        ltp: midcapQ.ltp ?? null,
        change: midcapQ.netChange ?? null,
        pChange: midcapQ.percentChange ?? null,
        high: midcapQ.high ?? null,
        low: midcapQ.low ?? null,
      },
    },
    fiiDii: fiiDii.status === "fulfilled" ? fiiDii.value : {},
    usdInr: usdInr.status === "fulfilled" ? usdInr.value : {},
    repoRate: repoRate.status === "fulfilled" ? repoRate.value : {},
    breadth: breadth.status === "fulfilled" ? breadth.value : {},
    marketTime: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
  };
}

module.exports = { getAllMarketData, getIndexCandles };
