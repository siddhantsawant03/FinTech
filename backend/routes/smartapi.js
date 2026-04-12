const express = require('express');
const router = express.Router();
const smartapi = require('../services/smartapi');

// POST /api/smartapi/login
router.post('/login', async (req, res) => {
  const { clientId, password, totp } = req.body;
  if (!clientId || !password || !totp) {
    return res.status(400).json({ error: 'clientId, password, and totp required' });
  }

  const result = await smartapi.generateSession(clientId, password, totp);
  if (!result.success) {
    return res.status(401).json({ error: result.error || 'Authentication failed' });
  }

  // Return token (never store API key server-side)
  res.json({
    success: true,
    jwtToken: result.session.jwtToken,
    feedToken: result.session.feedToken,
    clientId
  });
});

// GET /api/smartapi/profile
router.get('/profile', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const profile = await smartapi.getProfile(token);
  if (!profile) return res.status(500).json({ error: 'Could not fetch profile' });
  res.json(profile);
});

// GET /api/smartapi/holdings
router.get('/holdings', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const holdings = await smartapi.getPortfolioHoldings(token);
  res.json(holdings);
});

// GET /api/smartapi/orders
router.get('/orders', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const orders = await smartapi.getOrderBook(token);
  res.json(orders);
});

// POST /api/smartapi/quotes
router.post('/quotes', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const { tokens } = req.body;
  if (!tokens || !Array.isArray(tokens)) {
    return res.status(400).json({ error: 'tokens array required' });
  }

  const quotes = await smartapi.getQuote(token, tokens);
  res.json(quotes);
});

// POST /api/smartapi/candles
router.post('/candles', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const { symbolToken, interval, fromDate, toDate } = req.body;
  const candles = await smartapi.getCandleData(token, symbolToken, interval || 'ONE_DAY', fromDate, toDate);
  res.json(candles);
});

// GET /api/smartapi/indices
router.get('/indices', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const indices = await smartapi.getIndices(token);
  res.json(indices);
});

// GET /api/smartapi/gainers-losers
router.get('/gainers-losers', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const { type } = req.query;
  const data = await smartapi.getGainerLoser(token, type || 'PercPriceGainers');
  res.json(data);
});

// GET /api/smartapi/market-status
router.get('/market-status', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const status = await smartapi.getMarketStatus(token);
  res.json(status);
});

// POST /api/smartapi/search
router.post('/search', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const { query } = req.body;
  const results = await smartapi.searchScrip(token, query);
  res.json(results);
});

// POST /api/smartapi/depth
router.post('/depth', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const { symbolToken } = req.body;
  const depth = await smartapi.getMarketDepth(token, symbolToken);
  res.json(depth);
});

module.exports = router;
