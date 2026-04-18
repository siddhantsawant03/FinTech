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

# Optional: if frontend and backend are hosted on different domains,
# create /frontend/.env from /frontend/.env.example and point it to the backend
# e.g. VITE_API_URL=https://your-backend.example.com
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

### Render deployment

This repo is now set up to run on Render as a single Node web service:

1. Set the Render root directory to the repo root.
2. Use `npm run build` as the build command.
3. Use `npm start` as the start command.
4. Set the health check path to `/api/health`.
5. Add the backend environment variables from `backend/.env.example` in Render.

In this mode, Express serves `frontend/dist`, so the frontend should use relative `/api` calls. Do not set `VITE_API_URL` unless you are deploying the frontend and backend as separate Render services.

If you do split them into separate services:

- Set `frontend` env `VITE_API_URL=https://your-backend-service.onrender.com`
- Set backend env `CORS_ORIGINS=https://your-frontend-service.onrender.com`

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
