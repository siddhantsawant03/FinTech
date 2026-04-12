@echo off
echo.
echo ==========================================
echo    AI WEALTH ALLOCATOR -- Setup
echo ==========================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org (v18+)
    pause
    exit /b 1
)

echo Found Node.js:
node -v

echo.
echo Installing backend dependencies...
cd backend
call npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: Backend install failed.
    pause
    exit /b 1
)
echo Backend ready.

if not exist .env (
    copy .env.example .env
    echo.
    echo NOTICE: Created backend\.env from template.
    echo         Edit it with your Angel One SmartAPI credentials.
    echo         Demo Mode works without credentials.
    echo.
)

echo.
echo Installing frontend dependencies...
cd ..\frontend
call npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: Frontend install failed.
    pause
    exit /b 1
)
echo Frontend ready.

cd ..
echo.
echo ==========================================
echo        Setup complete!
echo ==========================================
echo.
echo To start the app, open 2 command prompts:
echo.
echo   Prompt 1 (backend):
echo     cd backend
echo     npm run dev
echo.
echo   Prompt 2 (frontend):
echo     cd frontend
echo     npm run dev
echo.
echo Then open: http://localhost:5173
echo.
pause
