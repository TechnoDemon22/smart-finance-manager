@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo  Starting Smart Finance Manager in Development Mode
echo ========================================================

echo Starting Python Flask backend on port 5500...
start "SmartFinance-Backend" cmd /k "cd /d %~dp0..\backend && python app.py --port 5500 --dev"

timeout /t 2 /nobreak > nul

echo Starting React Vite dev server on port 3000...
start "SmartFinance-Frontend" cmd /k "cd /d %~dp0..\frontend && npm.cmd run dev"

echo.
echo Development servers started:
echo   - Backend:  http://127.0.0.1:5500
echo   - Frontend: http://localhost:3000
echo.
