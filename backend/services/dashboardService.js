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
  const NSE_ENDPOINTS = [
    "https://www.nseindia.com/api/fiidiiTradeReact",
    "https://www.nseindia.com/api/fii-dii-trade-data",
    "https://www.nseindia.com/api/historical/fiiDii",
  ];

  // Get NSE session cookie first
  let cookie = "";
  try {
    const home = await axios.get("https://www.nseindia.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 12000,
    });
    cookie = (home.headers["set-cookie"] || [])
      .map((c) => c.split(";")[0])
      .join("; ");
  } catch (e) {
    console.error("[dashboardService] NSE cookie failed:", e.message);
  }

  // Try NSE endpoints
  for (const url of NSE_ENDPOINTS) {
    try {
      const res = await axios.get(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/json",
          Referer: "https://www.nseindia.com/",
          Cookie: cookie,
        },
        timeout: 10000,
      });
      const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (list.length > 0) {
        console.log(`[dashboardService] FII/DII: success from ${url}`);
        const parseNum = (v) =>
          parseFloat(String(v || "0").replace(/,/g, "")) || 0;
        const fiiRow =
          list.find(
            (r) => r.category?.includes("FII") || r.category?.includes("FPI"),
          ) || list[0];
        const diiRow =
          list.find((r) => r.category?.includes("DII")) || list[1] || {};
        return {
          fii: {
            buyValue: parseNum(fiiRow.buyValue),
            sellValue: parseNum(fiiRow.sellValue),
            netValue: parseNum(fiiRow.netValue),
          },
          dii: {
            buyValue: parseNum(diiRow.buyValue),
            sellValue: parseNum(diiRow.sellValue),
            netValue: parseNum(diiRow.netValue),
          },
          date: fiiRow.date || new Date().toLocaleDateString("en-IN"),
          history: list.slice(0, 10).map((d) => ({
            date: d.date,
            fiiNet: parseNum(d.netValue),
            diiNet: parseNum(d.netValue2 || 0),
          })),
        };
      }
    } catch (e) {
      console.warn(
        `[dashboardService] FII/DII NSE endpoint failed (${url}):`,
        e?.response?.status || e.message,
      );
    }
  }

  // Try Moneycontrol (your existing source 1)
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
    const list = Array.isArray(res.data?.data || res.data)
      ? res.data?.data || res.data
      : [];
    if (list.length > 0) {
      console.log("[dashboardService] FII/DII: success from Moneycontrol");
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
          fiiNet: parseNum(d.fii_net ?? d.fiiNetValue),
          diiNet: parseNum(d.dii_net ?? d.diiNetValue),
        })),
      };
    }
  } catch (e) {
    console.error(
      "[dashboardService] getFIIDIIData Moneycontrol error:",
      e.message,
    );
  }

  // Try BSE (your existing source 2)
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
    const list = Array.isArray(res.data?.Table || res.data)
      ? res.data?.Table || res.data
      : [];
    if (list.length > 0) {
      console.log("[dashboardService] FII/DII: success from BSE");
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
          fiiNet: parseNum(d.FII_NetValue ?? d.fiiNetValue),
          diiNet: parseNum(d.DII_NetValue ?? d.diiNetValue),
        })),
      };
    }
  } catch (e) {
    console.error("[dashboardService] getFIIDIIData BSE error:", e.message);
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
