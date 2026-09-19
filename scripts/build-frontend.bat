@echo off
setlocal enabledelayedexpansion

echo ========================================================
echo  Building Smart Finance Manager Frontend (Vite)
echo ========================================================

cd /d "%~dp0..\frontend"

echo [1/2] Checking npm dependencies...
call npm.cmd install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed.
    exit /b %ERRORLEVEL%
)

echo [2/2] Compiling production bundle...
call npm.cmd run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Frontend build failed.
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo  Frontend Build Complete: frontend\dist
echo ========================================================
