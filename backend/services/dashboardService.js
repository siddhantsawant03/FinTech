const axios = require("axios");
const NodeCache = require("node-cache");

const SMARTAPI_BASE = "https://apiconnect.angelone.in";
const OUNCE_TO_10G = 10 / 31.1034768;

const INDEX_TOKENS = {
  NIFTY: { token: "99926000", exchange: "NSE" },
  SENSEX: { token: "99919000", exchange: "BSE" },
  BANKNIFTY: { token: "99926009", exchange: "NSE" },
  NIFTYMIDCAP: { token: "99926011", exchange: "NSE" },
};

const marketCache = new NodeCache({ stdTTL: 45, useClones: false });
const candleCache = new NodeCache({ stdTTL: 75, useClones: false });
const macroCache = new NodeCache({ stdTTL: 300, useClones: false });
const yahooCache = new NodeCache({ stdTTL: 300, useClones: false });

function smartHeaders(jwtToken) {
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

function safeNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseFloat(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function round(value, decimals = 2) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(decimals));
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(value));
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function percentDelta(current, baseline) {
  if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline === 0) {
    return null;
  }
  return round(((current - baseline) / baseline) * 100, 2);
}

function toSparkSeries(values = []) {
  return values
    .filter((value) => Number.isFinite(value))
    .map((close, index) => ({ time: index, close: round(close, 2) }));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getIstNow() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  );
}

function getPreviousWeekday(date) {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  while (previous.getDay() === 0 || previous.getDay() === 6) {
    previous.setDate(previous.getDate() - 1);
  }
  return previous;
}

function formatAngelDate(date) {
  return (
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-` +
    `${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours(),
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  );
}

async function getNseJson(path) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.nseindia.com/",
  };

  try {
    const response = await axios.get(`https://www.nseindia.com${path}`, {
      headers,
      timeout: 10000,
    });
    return response.data;
  } catch (axiosError) {
    const response = await fetch(`https://www.nseindia.com${path}`, {
      headers,
    });

    if (!response.ok) {
      throw axiosError;
    }

    return response.json();
  }
}

async function getYahooChart(symbol, range = "1mo", interval = "1d") {
  const cacheKey = `yahoo:${symbol}:${range}:${interval}`;
  const cached = yahooCache.get(cacheKey);
  if (cached) return cached;

  const response = await axios.get(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "application/json",
      },
      timeout: 10000,
    },
  );

  const result = response.data?.chart?.result?.[0];
  const closes = (result?.indicators?.quote?.[0]?.close || []).filter((value) =>
    Number.isFinite(value),
  );
  const current = safeNumber(result?.meta?.regularMarketPrice) ?? closes.at(-1) ?? null;

  const chart = {
    current,
    avg30d: round(average(closes), 2),
    previousClose: safeNumber(result?.meta?.chartPreviousClose),
    closes,
  };
  chart.vs30dAvgPct = percentDelta(chart.current, chart.avg30d);

  yahooCache.set(cacheKey, chart);
  return chart;
}

function mapIndexRow(row) {
  if (!row) return {};

  const current = safeNumber(row.last);
  const yearHigh = safeNumber(row.yearHigh);
  const oneMonthAgoVal = safeNumber(row.oneMonthAgoVal);

  return {
    ltp: current,
    change: safeNumber(row.variation),
    pChange: safeNumber(row.percentChange),
    open: safeNumber(row.open),
    high: safeNumber(row.high),
    low: safeNumber(row.low),
    close: safeNumber(row.previousClose),
    yearHigh,
    yearLow: safeNumber(row.yearLow),
    pe: safeNumber(row.pe),
    pb: safeNumber(row.pb),
    dy: safeNumber(row.dy),
    advances: safeNumber(row.advances),
    declines: safeNumber(row.declines),
    unchanged: safeNumber(row.unchanged),
    oneMonthAgoVal,
    vs30dRefPct: percentDelta(current, oneMonthAgoVal),
    drawdownFromYearHighPct:
      Number.isFinite(current) && Number.isFinite(yearHigh) && yearHigh !== 0
        ? round(((current - yearHigh) / yearHigh) * 100, 2)
        : null,
  };
}

function pickIndex(rows, ...names) {
  const normalizedNames = names.map((name) => name.toUpperCase());
  return rows.find((row) =>
    normalizedNames.includes(String(row.index || row.indexSymbol || "").toUpperCase()),
  );
}

async function getNseMarketSnapshot() {
  const cached = macroCache.get("nse-market-snapshot");
  if (cached) return cached;

  const payload = await getNseJson("/api/allIndices");
  const rows = payload?.data || [];

  const nifty = mapIndexRow(pickIndex(rows, "NIFTY 50"));
  const bankNifty = mapIndexRow(pickIndex(rows, "NIFTY BANK"));
  const midcap = mapIndexRow(
    pickIndex(rows, "NIFTY MIDCAP 100", "NIFTY MIDCAP 150"),
  );
  const indiaVix = mapIndexRow(pickIndex(rows, "INDIA VIX"));

  const breadthTotal =
    (nifty.advances || 0) + (nifty.declines || 0) + (nifty.unchanged || 0);

  const snapshot = {
    nifty: {
      ...nifty,
      niftyPE: nifty.pe,
      niftyPB: nifty.pb,
      niftyDiv: nifty.dy,
    },
    bankNifty: {
      ...bankNifty,
      bankNiftyPE: bankNifty.pe,
      bankNiftyPB: bankNifty.pb,
    },
    midcap: {
      ...midcap,
      midcapPE: midcap.pe,
      midcapPB: midcap.pb,
    },
    indiaVix,
    breadth: {
      advances: nifty.advances || 0,
      declines: nifty.declines || 0,
      unchanged: nifty.unchanged || 0,
      total: breadthTotal,
      ratio:
        breadthTotal > 0
          ? round(((nifty.advances || 0) - (nifty.declines || 0)) / breadthTotal, 3)
          : null,
    },
  };

  macroCache.set("nse-market-snapshot", snapshot);
  return snapshot;
}

async function getFIIDIIData() {
  const cached = macroCache.get("fii-dii");
  if (cached) return cached;

  try {
    const rows = await getNseJson("/api/fiidiiTradeReact");
    const list = Array.isArray(rows) ? rows : [];

    const byDate = new Map();
    let fii = null;
    let dii = null;

    for (const row of list) {
      const category = String(row.category || "").toUpperCase();
      const date = row.date || row.tradeDate || new Date().toLocaleDateString("en-IN");
      const netValue = safeNumber(row.netValue || row.fiiNetValue || row.diiNetValue) || 0;
      const buyValue = safeNumber(row.buyValue || row.fiiBuyValue || row.diiBuyValue) || 0;
      const sellValue = safeNumber(row.sellValue || row.fiiSellValue || row.diiSellValue) || 0;

      if ((category === "FII" || category === "FII/FPI") && !fii) {
        fii = { buyValue, sellValue, netValue };
      }
      if (category === "DII" && !dii) {
        dii = { buyValue, sellValue, netValue };
      }

      if (!byDate.has(date)) {
        byDate.set(date, { date, fiiNet: null, diiNet: null });
      }
      const historyRow = byDate.get(date);
      if (category === "FII" || category === "FII/FPI") historyRow.fiiNet = netValue;
      if (category === "DII") historyRow.diiNet = netValue;
    }

    const history = Array.from(byDate.values()).slice(0, 10);
    const payload = {
      fii: fii || { buyValue: 0, sellValue: 0, netValue: 0 },
      dii: dii || { buyValue: 0, sellValue: 0, netValue: 0 },
      date: history[0]?.date || new Date().toLocaleDateString("en-IN"),
      history,
      unavailable: !fii && !dii,
    };

    macroCache.set("fii-dii", payload);
    return payload;
  } catch (error) {
    return {
      fii: { buyValue: 0, sellValue: 0, netValue: 0 },
      dii: { buyValue: 0, sellValue: 0, netValue: 0 },
      date: new Date().toLocaleDateString("en-IN"),
      history: [],
      unavailable: true,
      note: "NSE FII/DII feed unavailable",
    };
  }
}

async function getUSDINR() {
  const cached = macroCache.get("usd-inr");
  if (cached) return cached;

  try {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 31);

    const response = await axios.get(
      `https://api.frankfurter.app/${formatDate(startDate)}..?from=USD&to=INR`,
      { timeout: 8000 },
    );

    const values = Object.values(response.data?.rates || {})
      .map((day) => safeNumber(day.INR))
      .filter((value) => Number.isFinite(value));

    const current = values.at(-1) ?? null;
    const avg30d = average(values);

    const payload = {
      rate: round(current, 2),
      avg30d: round(avg30d, 2),
      vs30dAvgPct: percentDelta(current, avg30d),
      source: "Frankfurter",
      date: response.data?.end_date || formatDate(endDate),
    };

    macroCache.set("usd-inr", payload);
    return payload;
  } catch (error) {
    try {
      const fallback = await axios.get("https://open.er-api.com/v6/latest/USD", {
        timeout: 8000,
      });
      return {
        rate: round(safeNumber(fallback.data?.rates?.INR), 2),
        avg30d: null,
        vs30dAvgPct: null,
        source: "ExchangeRate-API",
      };
    } catch (_) {
      return { rate: null, avg30d: null, vs30dAvgPct: null };
    }
  }
}

async function getGoldData(usdInr) {
  const cacheKey = `gold:${usdInr?.rate || "na"}:${usdInr?.avg30d || "na"}`;
  const cached = macroCache.get(cacheKey);
  if (cached) return cached;

  try {
    const chart = await getYahooChart("GC=F");
    const currentUsdOz = chart.current;
    const avg30dUsdOz = chart.avg30d;

    const price10gInr =
      Number.isFinite(currentUsdOz) && Number.isFinite(usdInr?.rate)
        ? round(currentUsdOz * usdInr.rate * OUNCE_TO_10G, 2)
        : null;

    const avg30d10gInr =
      Number.isFinite(avg30dUsdOz) && Number.isFinite(usdInr?.avg30d)
        ? round(avg30dUsdOz * usdInr.avg30d * OUNCE_TO_10G, 2)
        : null;

    const payload = {
      priceUsdOz: round(currentUsdOz, 2),
      avg30dUsdOz: round(avg30dUsdOz, 2),
      price10gInr,
      avg30d10gInr,
      vs30dAvgPct: percentDelta(price10gInr, avg30d10gInr),
      source: "Yahoo Finance",
    };

    macroCache.set(cacheKey, payload);
    return payload;
  } catch (error) {
    try {
      const fallback = await axios.get("https://api.gold-api.com/price/XAU", {
        timeout: 8000,
      });
      const currentUsdOz = safeNumber(fallback.data?.price);
      const price10gInr =
        Number.isFinite(currentUsdOz) && Number.isFinite(usdInr?.rate)
          ? round(currentUsdOz * usdInr.rate * OUNCE_TO_10G, 2)
          : null;
      return {
        priceUsdOz: round(currentUsdOz, 2),
        avg30dUsdOz: null,
        price10gInr,
        avg30d10gInr: null,
        vs30dAvgPct: null,
        source: "Gold API fallback",
      };
    } catch (_) {
      return {
        priceUsdOz: null,
        avg30dUsdOz: null,
        price10gInr: null,
        avg30d10gInr: null,
        vs30dAvgPct: null,
      };
    }
  }
}

async function getRepoRate() {
  const cached = macroCache.get("repo-rate");
  if (cached) return cached;

  try {
    const response = await axios.get("https://www.rbi.org.in/home.aspx", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 10000,
    });

    const html = response.data || "";
    const rate =
      safeNumber(
        html.match(/Policy\s*Repo\s*Rate[^0-9]+([0-9.]+)%/i)?.[1],
      ) ?? 5.25;
    const lastUpdated =
      html.match(/Last\s*Updated\s*:\s*<\/span>\s*([^<]+)/i)?.[1]?.trim() || null;

    const payload = {
      rate: round(rate, 2),
      lastUpdated,
      source: "RBI",
    };

    macroCache.set("repo-rate", payload);
    return payload;
  } catch (error) {
    return {
      rate: 5.25,
      lastUpdated: null,
      source: "RBI fallback",
    };
  }
}

async function getIndexQuotes(jwtToken) {
  if (!jwtToken) return [];

  try {
    const response = await axios.post(
      `${SMARTAPI_BASE}/rest/secure/angelbroking/market/v1/quote/`,
      {
        mode: "FULL",
        exchangeTokens: {
          NSE: [
            INDEX_TOKENS.NIFTY.token,
            INDEX_TOKENS.BANKNIFTY.token,
            INDEX_TOKENS.NIFTYMIDCAP.token,
          ],
          BSE: [INDEX_TOKENS.SENSEX.token],
        },
      },
      {
        headers: smartHeaders(jwtToken),
        timeout: 10000,
      },
    );

    return response.data?.data?.fetched || [];
  } catch (error) {
    console.error("[dashboardService] getIndexQuotes error:", error.message);
    return [];
  }
}

async function getIndexCandles(
  jwtToken,
  symbolToken,
  interval = "FIVE_MINUTE",
  exchange = "NSE",
) {
  if (!jwtToken) return [];

  const cacheKey = `candles:${symbolToken}:${interval}:${exchange}`;
  const cached = candleCache.get(cacheKey);
  if (cached) return cached;

  try {
    const now = getIstNow();
    let toDate = new Date(now);
    let fromDate = new Date(now);
    fromDate.setHours(9, 15, 0, 0);

    const beforeMarketOpen =
      now.getHours() < 9 || (now.getHours() === 9 && now.getMinutes() < 15);
    const afterMarketClose =
      now.getHours() > 15 || (now.getHours() === 15 && now.getMinutes() >= 30);
    const isWeekend = now.getDay() === 0 || now.getDay() === 6;

    if (beforeMarketOpen || isWeekend) {
      toDate = getPreviousWeekday(now);
      toDate.setHours(15, 30, 0, 0);
      fromDate = new Date(toDate);
      fromDate.setHours(9, 15, 0, 0);
    } else if (afterMarketClose) {
      toDate.setHours(15, 30, 0, 0);
    }

    const response = await axios.post(
      `${SMARTAPI_BASE}/rest/secure/angelbroking/historical/v1/getCandleData`,
      {
        exchange,
        symboltoken: symbolToken,
        interval,
        fromdate: formatAngelDate(fromDate),
        todate: formatAngelDate(toDate),
      },
      {
        headers: smartHeaders(jwtToken),
        timeout: 10000,
      },
    );

    const candles = (response.data?.data || []).map((candle) => ({
      time: candle[0],
      open: candle[1],
      high: candle[2],
      low: candle[3],
      close: candle[4],
      volume: candle[5],
    }));

    if (candles.length > 0) {
      candleCache.set(cacheKey, candles);
      return candles;
    }

    return cached || [];
  } catch (error) {
    if (cached) return cached;
    console.error(
      "[dashboardService] getIndexCandles error:",
      error.response?.data || error.message,
    );
    return [];
  }
}

function buildMacroRegime({ nifty, indiaVix, usdInr, gold, breadth }) {
  let score = 0;
  const drivers = [];

  if (Number.isFinite(nifty?.niftyPE)) {
    if (nifty.niftyPE >= 23) {
      score -= 2;
      drivers.push(`Nifty PE elevated at ${nifty.niftyPE}x`);
    } else if (nifty.niftyPE <= 18.5) {
      score += 2;
      drivers.push(`Nifty PE attractive at ${nifty.niftyPE}x`);
    }
  }

  if (Number.isFinite(nifty?.vs30dAvgPct)) {
    if (nifty.vs30dAvgPct >= 4) {
      score -= 1;
      drivers.push(`Nifty is ${nifty.vs30dAvgPct}% above 30D average`);
    } else if (nifty.vs30dAvgPct <= -4) {
      score += 1;
      drivers.push(`Nifty is ${Math.abs(nifty.vs30dAvgPct)}% below 30D average`);
    }
  }

  if (Number.isFinite(indiaVix?.ltp)) {
    if (indiaVix.ltp >= 20 || (indiaVix.vs30dAvgPct || 0) >= 15) {
      score -= 2;
      drivers.push(`India VIX elevated at ${indiaVix.ltp}`);
    } else if (indiaVix.ltp <= 14 && (indiaVix.vs30dAvgPct || 0) <= -10) {
      score += 1;
      drivers.push(`India VIX subdued at ${indiaVix.ltp}`);
    }
  }

  if (Number.isFinite(usdInr?.vs30dAvgPct)) {
    if (usdInr.vs30dAvgPct >= 1) {
      score -= 1;
      drivers.push(`USD/INR is ${usdInr.vs30dAvgPct}% above 30D average`);
    } else if (usdInr.vs30dAvgPct <= -1) {
      score += 1;
      drivers.push(`USD/INR below recent average`);
    }
  }

  if (Number.isFinite(gold?.vs30dAvgPct)) {
    if (gold.vs30dAvgPct >= 3) {
      score -= 1;
      drivers.push(`Gold is ${gold.vs30dAvgPct}% above 30D average`);
    } else if (gold.vs30dAvgPct <= -3) {
      score += 1;
      drivers.push(`Gold is below 30D average`);
    }
  }

  if (Number.isFinite(breadth?.ratio)) {
    if (breadth.ratio <= -0.25) {
      score -= 1;
      drivers.push("Market breadth is weak");
    } else if (breadth.ratio >= 0.25) {
      score += 1;
      drivers.push("Market breadth is strong");
    }
  }

  let stance = "neutral";
  if (score <= -3) stance = "risk_off";
  if (score >= 3) stance = "risk_on";

  return { score, stance, drivers };
}

async function getAllMarketData(jwtToken) {
  const cached = marketCache.get("market-snapshot-v2");
  if (cached) return cached;

  const [quotesResult, nseSnapshotResult, fiiDiiResult, usdInrResult, repoRateResult] =
    await Promise.allSettled([
      getIndexQuotes(jwtToken),
      getNseMarketSnapshot(),
      getFIIDIIData(),
      getUSDINR(),
      getRepoRate(),
    ]);

  const quotes = quotesResult.status === "fulfilled" ? quotesResult.value : [];
  const nseSnapshot =
    nseSnapshotResult.status === "fulfilled"
      ? nseSnapshotResult.value
      : { nifty: {}, bankNifty: {}, midcap: {}, indiaVix: {}, breadth: {} };
  const fiiDii = fiiDiiResult.status === "fulfilled" ? fiiDiiResult.value : {};
  const usdInr = usdInrResult.status === "fulfilled" ? usdInrResult.value : {};
  const repoRate =
    repoRateResult.status === "fulfilled" ? repoRateResult.value : {};

  const [
    niftyTrendResult,
    sensexTrendResult,
    vixTrendResult,
    goldResult,
    niftyCandlesResult,
    sensexCandlesResult,
  ] =
    await Promise.allSettled([
      getYahooChart("^NSEI"),
      getYahooChart("^BSESN"),
      getYahooChart("^INDIAVIX"),
      getGoldData(usdInr),
      getIndexCandles(
        jwtToken,
        INDEX_TOKENS.NIFTY.token,
        "FIVE_MINUTE",
        INDEX_TOKENS.NIFTY.exchange,
      ),
      getIndexCandles(
        jwtToken,
        INDEX_TOKENS.SENSEX.token,
        "FIVE_MINUTE",
        INDEX_TOKENS.SENSEX.exchange,
      ),
    ]);

  const niftyTrend = niftyTrendResult.status === "fulfilled" ? niftyTrendResult.value : {};
  const sensexTrend =
    sensexTrendResult.status === "fulfilled" ? sensexTrendResult.value : {};
  const vixTrend = vixTrendResult.status === "fulfilled" ? vixTrendResult.value : {};
  const gold = goldResult.status === "fulfilled" ? goldResult.value : {};
  const angelNiftyCandles =
    niftyCandlesResult.status === "fulfilled" ? niftyCandlesResult.value : [];
  const angelSensexCandles =
    sensexCandlesResult.status === "fulfilled" ? sensexCandlesResult.value : [];
  const niftyCandles =
    angelNiftyCandles.length > 0 ? angelNiftyCandles : toSparkSeries(niftyTrend.closes);
  const sensexCandles =
    angelSensexCandles.length > 0
      ? angelSensexCandles
      : toSparkSeries(sensexTrend.closes);

  const findQuote = (token) =>
    quotes.find((quote) => String(quote.symbolToken) === String(token)) || {};

  const niftyQuote = findQuote(INDEX_TOKENS.NIFTY.token);
  const sensexQuote = findQuote(INDEX_TOKENS.SENSEX.token);
  const bankNiftyQuote = findQuote(INDEX_TOKENS.BANKNIFTY.token);
  const midcapQuote = findQuote(INDEX_TOKENS.NIFTYMIDCAP.token);

  const indices = {
    nifty: {
      ltp: safeNumber(niftyQuote.ltp) ?? nseSnapshot.nifty.ltp ?? null,
      change: safeNumber(niftyQuote.netChange) ?? nseSnapshot.nifty.change ?? null,
      pChange:
        safeNumber(niftyQuote.percentChange) ?? nseSnapshot.nifty.pChange ?? null,
      high: safeNumber(niftyQuote.high) ?? nseSnapshot.nifty.high ?? null,
      low: safeNumber(niftyQuote.low) ?? nseSnapshot.nifty.low ?? null,
      open: safeNumber(niftyQuote.open) ?? nseSnapshot.nifty.open ?? null,
      close: safeNumber(niftyQuote.close) ?? nseSnapshot.nifty.close ?? null,
      yearHigh: nseSnapshot.nifty.yearHigh ?? null,
      yearLow: nseSnapshot.nifty.yearLow ?? null,
      drawdownFromYearHighPct: nseSnapshot.nifty.drawdownFromYearHighPct ?? null,
      avg30d: niftyTrend.avg30d ?? null,
      vs30dAvgPct:
        percentDelta(
          safeNumber(niftyQuote.ltp) ?? nseSnapshot.nifty.ltp,
          niftyTrend.avg30d,
        ) ?? nseSnapshot.nifty.vs30dRefPct ?? null,
      niftyPE: nseSnapshot.nifty.niftyPE ?? null,
      niftyPB: nseSnapshot.nifty.niftyPB ?? null,
      niftyDiv: nseSnapshot.nifty.niftyDiv ?? null,
    },
    sensex: {
      ltp: safeNumber(sensexQuote.ltp) ?? null,
      change: safeNumber(sensexQuote.netChange) ?? null,
      pChange: safeNumber(sensexQuote.percentChange) ?? null,
      high: safeNumber(sensexQuote.high) ?? null,
      low: safeNumber(sensexQuote.low) ?? null,
      open: safeNumber(sensexQuote.open) ?? null,
      close: safeNumber(sensexQuote.close) ?? null,
      sensexPE: null,
      sensexPB: null,
    },
    bankNifty: {
      ltp: safeNumber(bankNiftyQuote.ltp) ?? nseSnapshot.bankNifty.ltp ?? null,
      change:
        safeNumber(bankNiftyQuote.netChange) ?? nseSnapshot.bankNifty.change ?? null,
      pChange:
        safeNumber(bankNiftyQuote.percentChange) ??
        nseSnapshot.bankNifty.pChange ??
        null,
      high: safeNumber(bankNiftyQuote.high) ?? nseSnapshot.bankNifty.high ?? null,
      low: safeNumber(bankNiftyQuote.low) ?? nseSnapshot.bankNifty.low ?? null,
      bankNiftyPE: nseSnapshot.bankNifty.bankNiftyPE ?? null,
      bankNiftyPB: nseSnapshot.bankNifty.bankNiftyPB ?? null,
    },
    niftyMidcap: {
      ltp: safeNumber(midcapQuote.ltp) ?? nseSnapshot.midcap.ltp ?? null,
      change: safeNumber(midcapQuote.netChange) ?? nseSnapshot.midcap.change ?? null,
      pChange:
        safeNumber(midcapQuote.percentChange) ?? nseSnapshot.midcap.pChange ?? null,
      high: safeNumber(midcapQuote.high) ?? nseSnapshot.midcap.high ?? null,
      low: safeNumber(midcapQuote.low) ?? nseSnapshot.midcap.low ?? null,
      midcapPE: nseSnapshot.midcap.midcapPE ?? null,
      midcapPB: nseSnapshot.midcap.midcapPB ?? null,
    },
  };

  const volatility = {
    indiaVix: {
      ltp: nseSnapshot.indiaVix.ltp ?? vixTrend.current ?? null,
      change: nseSnapshot.indiaVix.change ?? null,
      pChange: nseSnapshot.indiaVix.pChange ?? null,
      high: nseSnapshot.indiaVix.high ?? null,
      low: nseSnapshot.indiaVix.low ?? null,
      avg30d: vixTrend.avg30d ?? null,
      vs30dAvgPct:
        percentDelta(nseSnapshot.indiaVix.ltp ?? vixTrend.current, vixTrend.avg30d) ??
        nseSnapshot.indiaVix.vs30dRefPct ??
        null,
    },
  };

  const macro = buildMacroRegime({
    nifty: indices.nifty,
    indiaVix: volatility.indiaVix,
    usdInr,
    gold,
    breadth: nseSnapshot.breadth,
  });

  const payload = {
    indices,
    volatility,
    gold,
    usdInr,
    repoRate,
    breadth: nseSnapshot.breadth,
    fiiDii,
    macro,
    charts: {
      nifty: niftyCandles,
      sensex: sensexCandles,
    },
    marketTime: new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
    }),
  };

  if (
    Number.isFinite(payload.indices?.nifty?.ltp) ||
    Number.isFinite(payload.indices?.nifty?.niftyPE)
  ) {
    marketCache.set("market-snapshot-v2", payload);
  }

  return payload;
}

module.exports = { getAllMarketData, getIndexCandles };
