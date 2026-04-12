# AI Wealth Allocator

A full-stack AI-powered wealth allocation tool built with React + Node.js + Angel One SmartAPI.

---

## Prerequisites

- Node.js v18+ (https://nodejs.org)
- An Angel One account with SmartAPI access
- SmartAPI key from https://smartapi.angelbroking.com

---

## Setup & Run

### 1. Install dependencies

```bash
# Install backend deps
cd backend
npm install

# Install frontend deps
cd ../frontend
npm install
```

### 2. Configure environment

```bash
# In /backend, create .env file:
cp .env.example .env
# Edit .env and fill in your ANGEL_ONE details
```

### 3. Start the app

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Then open: http://localhost:5173

---

## Architecture

```
wealth-allocator/
├── backend/          # Node.js + Express API server
│   ├── routes/       # API route handlers
│   ├── services/     # SmartAPI, AMFI, allocation engine
│   ├── engine/       # Core allocation rules logic
│   └── server.js     # Entry point
└── frontend/         # React + Vite app
    └── src/
        ├── pages/    # Layer 0-5 screens
        ├── components/ # Reusable UI components
        ├── hooks/    # API hooks
        └── context/  # App state
```

---

## SmartAPI Endpoints Used

| Endpoint | Purpose |
|---|---|
| generateSession | Auth token |
| getProfile | Auto-fill user KYC |
| getPortfolioHoldings | Existing investments |
| getOrderBook | Recent trade history |
| getQuote | Live LTP for stocks |
| getCandleData | 52w High/Low, historical |
| getMarketDepth | Liquidity filter |
| getFundamentals | D/E, EPS, P/E |
| getIndices | Nifty P/E tactical overlay |
| getGainerLoser | Market sentiment |
| getMarketStatus | Live/closed badge |
| searchScrip | Symbol lookup |

---

## Notes

- No trading is executed. This is a recommendation-only tool.
- Your Angel One API key is never stored on any server — only in your browser session.
- MF data comes from AMFI public API (free, no key needed).
