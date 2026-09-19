@echo off
echo ========================================================
echo  Building Smart Finance Backend (PyInstaller)
echo ========================================================

cd /d "%~dp0\..\backend"

echo Checking Python environment...
python --version
if %errorlevel% neq 0 (
    echo Error: Python is not installed or not in PATH.
    pause
    exit /b 1
)

echo Cleaning previous build artifacts...
if exist "dist\SmartFinanceBackend.exe" del /f /q "dist\SmartFinanceBackend.exe"
if exist "build" rd /s /q "build"

echo Running PyInstaller...
python -m PyInstaller SmartFinanceBackend.spec --noconfirm

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS: Backend executable built successfully!
    echo  Location: backend\dist\SmartFinanceBackend.exe
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  ERROR: Backend build failed.
    echo ========================================================
    pause
    exit /b 1
)
