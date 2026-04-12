const express = require('express');
const router = express.Router();
const amfiService = require('../services/amfi');

// GET /api/amfi/navs — all NAVs
router.get('/navs', async (req, res) => {
  const navs = await amfiService.getAllNavs();
  res.json({ count: Object.keys(navs).length, sample: Object.entries(navs).slice(0, 5) });
});

// GET /api/amfi/universe
router.get('/universe', async (req, res) => {
  const universe = await amfiService.getMFUniverse();
  res.json(universe);
});

// POST /api/amfi/recommendations
router.post('/recommendations', async (req, res) => {
  const { categories } = req.body;
  if (!categories || !Array.isArray(categories)) {
    return res.status(400).json({ error: 'categories array required' });
  }
  const recs = await amfiService.getRecommendations(categories);
  res.json(recs);
});

module.exports = router;
