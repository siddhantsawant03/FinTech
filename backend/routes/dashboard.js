const express = require("express");
const router = express.Router();
const dashboardService = require("../services/dashboardService");

/**
 * GET /api/dashboard/market
 * Returns all market insight data for the dashboard.
 * Requires: Authorization: Bearer <jwtToken> header
 */
router.get("/market", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const data = await dashboardService.getAllMarketData(token);
    res.json({ success: true, data, fetchedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[Dashboard] Error fetching market data:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/dashboard/candles/:symbol
 * Returns intraday candle data for a given symbol token (e.g. NIFTY=99926000, SENSEX=99919000)
 */
router.get("/candles/:symbol", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  const { symbol } = req.params;
  const { interval = "FIVE_MINUTE", exchange = "NSE" } = req.query;

  try {
    const candles = await dashboardService.getIndexCandles(
      token,
      symbol,
      interval,
      exchange,
    );
    res.json({ success: true, candles });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/debug", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  const axios = require("axios");

  // Test 1: Raw Angel One quote call
  let quoteResult = null;
  let quoteError = null;
  try {
    const r = await axios.post(
      "https://apiconnect.angelone.in/rest/secure/angelbroking/market/v1/quote/",
      {
        mode: "FULL",
        exchangeTokens: {
          NSE: ["99926000"],
          BSE: ["99919000"],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-UserType": "USER",
          "X-SourceID": "WEB",
          "X-ClientLocalIP": "127.0.0.1",
          "X-ClientPublicIP": "127.0.0.1",
          "X-MACAddress": "00:00:00:00:00:00",
          "X-PrivateKey": process.env.SMARTAPI_KEY,
        },
      },
    );
    quoteResult = r.data;
  } catch (e) {
    quoteError = e?.response?.data || e.message;
  }

  // Test 2: NSE cookie + FII call
  let fiiResult = null;
  let fiiError = null;
  try {
    const home = await axios.get("https://www.nseindia.com/", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      timeout: 10000,
    });
    const cookie = (home.headers["set-cookie"] || [])
      .map((c) => c.split(";")[0])
      .join("; ");
    const fii = await axios.get(
      "https://www.nseindia.com/api/fiidiiTradeReact",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
          Accept: "application/json",
          Referer: "https://www.nseindia.com/",
          Cookie: cookie,
        },
        timeout: 10000,
      },
    );
    fiiResult = { cookie: cookie.slice(0, 80) + "...", data: fii.data?.[0] };
  } catch (e) {
    fiiError = e?.response?.status + " " + (e?.response?.data || e.message);
  }

  res.json({ quoteResult, quoteError, fiiResult, fiiError });
});

module.exports = router;
