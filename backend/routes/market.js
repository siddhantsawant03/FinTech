const express = require('express');
const router = express.Router();
const smartapi = require('../services/smartapi');

// GET /api/market/pulse — combined market data
router.get('/pulse', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });

  const [status, indices, gainers, losers] = await Promise.all([
    smartapi.getMarketStatus(token),
    smartapi.getIndices(token),
    smartapi.getGainerLoser(token, 'PercPriceGainers'),
    smartapi.getGainerLoser(token, 'PercPriceLosers')
  ]);

  res.json({
    status,
    indices,
    gainers: gainers.slice(0, 5),
    losers: losers.slice(0, 5),
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
