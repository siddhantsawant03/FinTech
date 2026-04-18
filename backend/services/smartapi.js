const axios = require('axios');
const NodeCache = require('node-cache');

const SMARTAPI_BASE = 'https://apiconnect.angelbroking.com';

// Cache instances
const quotesCache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_QUOTES) || 30 });
const fundamentalsCache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_FUNDAMENTALS) || 3600 });
const indicesCache = new NodeCache({ stdTTL: parseInt(process.env.CACHE_TTL_INDICES) || 60 });

function normalizeErrorMessage(errorValue, fallback = 'Request failed') {
  if (!errorValue) return fallback;
  if (typeof errorValue === 'string') return errorValue;
  if (typeof errorValue === 'number' || typeof errorValue === 'boolean') {
    return String(errorValue);
  }
  if (typeof errorValue === 'object') {
    if (typeof errorValue.message === 'string') {
      return errorValue.code
        ? `${errorValue.code}: ${errorValue.message}`
        : errorValue.message;
    }
    if (typeof errorValue.error === 'string') return errorValue.error;
    try {
      return JSON.stringify(errorValue);
    } catch (_) {
      return fallback;
    }
  }
  return fallback;
}

class SmartAPIService {
  constructor() {
    this.sessions = new Map(); // clientId -> { token, feedToken, expiry }
  }

  // ─── AUTH ─────────────────────────────────────────────────────────────────

  async generateSession(clientId, password, totp) {
    try {
      const res = await axios.post(
        `${SMARTAPI_BASE}/rest/auth/angelbroking/user/v1/loginByPassword`,
        { clientcode: clientId, password, totp },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-UserType': 'USER',
            'X-SourceID': 'WEB',
            'X-ClientLocalIP': '127.0.0.1',
            'X-ClientPublicIP': '127.0.0.1',
            'X-MACAddress': '00:00:00:00:00:00',
            'X-PrivateKey': process.env.ANGEL_API_KEY
          }
        }
      );

      if (res.data.status && res.data.data) {
        const { jwtToken, feedToken, refreshToken } = res.data.data;
        const session = {
          jwtToken,
          feedToken,
          refreshToken,
          clientId,
          expiry: Date.now() + 23 * 60 * 60 * 1000 // 23 hours
        };
        this.sessions.set(clientId, session);
        return { success: true, session };
      }
      return {
        success: false,
        error: normalizeErrorMessage(res.data.message, 'Login failed'),
      };
    } catch (err) {
      return {
        success: false,
        error: normalizeErrorMessage(
          err.response?.data?.message || err.response?.data?.error || err.message,
          'Login failed',
        ),
      };
    }
  }

  getSession(clientId) {
    const session = this.sessions.get(clientId);
    if (!session || Date.now() > session.expiry) return null;
    return session;
  }

  getHeaders(jwtToken) {
    return {
      'Authorization': `Bearer ${jwtToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-UserType': 'USER',
      'X-SourceID': 'WEB',
      'X-ClientLocalIP': '127.0.0.1',
      'X-ClientPublicIP': '127.0.0.1',
      'X-MACAddress': '00:00:00:00:00:00',
      'X-PrivateKey': process.env.ANGEL_API_KEY
    };
  }

  // ─── USER ─────────────────────────────────────────────────────────────────

  async getProfile(jwtToken) {
    try {
      const res = await axios.get(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/user/v1/getProfile`,
        { headers: this.getHeaders(jwtToken) }
      );
      return res.data.status ? res.data.data : null;
    } catch (err) {
      console.error('getProfile error:', err.message);
      return null;
    }
  }

  async getPortfolioHoldings(jwtToken) {
    try {
      const res = await axios.get(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/portfolio/v1/getHolding`,
        { headers: this.getHeaders(jwtToken) }
      );
      return res.data.status ? (res.data.data || []) : [];
    } catch (err) {
      console.error('getPortfolioHoldings error:', err.message);
      return [];
    }
  }

  async getOrderBook(jwtToken) {
    try {
      const res = await axios.get(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/order/v1/getOrderBook`,
        { headers: this.getHeaders(jwtToken) }
      );
      return res.data.status ? (res.data.data || []) : [];
    } catch (err) {
      console.error('getOrderBook error:', err.message);
      return [];
    }
  }

  // ─── MARKET DATA ──────────────────────────────────────────────────────────

  async getQuote(jwtToken, symbolTokens) {
    const cacheKey = `quotes_${symbolTokens.join('_')}`;
    const cached = quotesCache.get(cacheKey);
    if (cached) return cached;

    try {
      const res = await axios.post(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/market/v1/quote`,
        {
          mode: 'FULL',
          exchangeTokens: { NSE: symbolTokens }
        },
        { headers: this.getHeaders(jwtToken) }
      );

      if (res.data.status) {
        const data = res.data.data?.fetched || [];
        quotesCache.set(cacheKey, data);
        return data;
      }
      return [];
    } catch (err) {
      console.error('getQuote error:', err.message);
      return [];
    }
  }

  async getCandleData(jwtToken, symbolToken, interval = 'ONE_DAY', fromDate, toDate) {
    try {
      const res = await axios.post(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/historical/v1/getCandleData`,
        {
          exchange: 'NSE',
          symboltoken: symbolToken,
          interval,
          fromdate: fromDate,
          todate: toDate
        },
        { headers: this.getHeaders(jwtToken) }
      );
      return res.data.status ? (res.data.data || []) : [];
    } catch (err) {
      console.error('getCandleData error:', err.message);
      return [];
    }
  }

  async getMarketDepth(jwtToken, symbolToken) {
    try {
      const res = await axios.post(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/market/v1/quote`,
        {
          mode: 'FULL',
          exchangeTokens: { NSE: [symbolToken] }
        },
        { headers: this.getHeaders(jwtToken) }
      );
      const data = res.data.data?.fetched?.[0];
      return data ? {
        avgVolume: data.avgPrice,
        buyQty: data.buyQty,
        sellQty: data.sellQty,
        depth: data.depth
      } : null;
    } catch (err) {
      console.error('getMarketDepth error:', err.message);
      return null;
    }
  }

  async searchScrip(jwtToken, query) {
    try {
      const res = await axios.post(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/order/v1/searchScrip`,
        { exchange: 'NSE', searchscrip: query },
        { headers: this.getHeaders(jwtToken) }
      );
      return res.data.status ? (res.data.data || []) : [];
    } catch (err) {
      console.error('searchScrip error:', err.message);
      return [];
    }
  }

  async getIndices(jwtToken) {
    const cached = indicesCache.get('indices');
    if (cached) return cached;

    try {
      // Nifty 50 token: 99926000, Nifty Midcap 150: 99926009, Nifty Smallcap 250: 99926013
      const res = await axios.post(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/market/v1/quote`,
        {
          mode: 'LTP',
          exchangeTokens: { NSE: ['99926000', '99926009', '99926013'] }
        },
        { headers: this.getHeaders(jwtToken) }
      );

      const data = res.data.data?.fetched || [];
      indicesCache.set('indices', data);
      return data;
    } catch (err) {
      console.error('getIndices error:', err.message);
      return [];
    }
  }

  async getGainerLoser(jwtToken, dataType = 'PercPriceGainers', expiryType = 'NEAR') {
    try {
      const res = await axios.get(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/market/v1/gainersLosers?datatype=${dataType}&expirytype=${expiryType}`,
        { headers: this.getHeaders(jwtToken) }
      );
      return res.data.status ? (res.data.data || []) : [];
    } catch (err) {
      console.error('getGainerLoser error:', err.message);
      return [];
    }
  }

  async getMarketStatus(jwtToken) {
    try {
      const res = await axios.get(
        `${SMARTAPI_BASE}/rest/secure/angelbroking/general/v1/getBrokermessage`,
        { headers: this.getHeaders(jwtToken) }
      );
      // Derive market status from time
      const now = new Date();
      const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const hours = ist.getHours();
      const mins = ist.getMinutes();
      const day = ist.getDay();
      const timeNum = hours * 100 + mins;
      const isWeekday = day >= 1 && day <= 5;
      const isMarketHours = timeNum >= 915 && timeNum <= 1530;
      return {
        isOpen: isWeekday && isMarketHours,
        time: ist.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
        day: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][day]
      };
    } catch (err) {
      return { isOpen: false, time: null, day: null };
    }
  }
}

module.exports = new SmartAPIService();
