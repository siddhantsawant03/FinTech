#!/bin/bash
set -e

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║     AI WEALTH ALLOCATOR — Setup          ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check node
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org (v18+)"
  exit 1
fi

NODE_VER=$(node -e "console.log(parseInt(process.version.slice(1)))")
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌ Node.js v18+ required. Current: $(node -v)"
  exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Backend deps
echo "📦 Installing backend dependencies..."
cd backend
npm install --silent
echo "✅ Backend ready"

# .env
if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "⚠️  Created backend/.env from template."
  echo "    Edit it to add your Angel One SmartAPI key."
  echo "    (You can still use Demo Mode without it.)"
  echo ""
fi

# Frontend deps
cd ../frontend
echo "📦 Installing frontend dependencies..."
npm install --silent
echo "✅ Frontend ready"

cd ..
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║           Setup complete! 🎉             ║"
echo "╠══════════════════════════════════════════╣"
echo "║                                          ║"
echo "║  To start the app, open 2 terminals:     ║"
echo "║                                          ║"
echo "║  Terminal 1 (backend):                   ║"
echo "║    cd backend && npm run dev             ║"
echo "║                                          ║"
echo "║  Terminal 2 (frontend):                  ║"
echo "║    cd frontend && npm run dev            ║"
echo "║                                          ║"
echo "║  Then open: http://localhost:5173        ║"
echo "║                                          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
