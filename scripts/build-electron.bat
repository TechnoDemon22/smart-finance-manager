@echo off
echo ========================================================
echo  Packaging Smart Finance Manager Desktop Application
echo ========================================================

set SCRIPT_DIR=%~dp0
cd /d "%SCRIPT_DIR%.."

echo [1/3] Verifying Backend Executable...
if not exist "backend\dist\SmartFinanceBackend.exe" (
    echo Backend executable not found. Building backend first...
    call "%SCRIPT_DIR%build-backend.bat"
    if %errorlevel% neq 0 (
        echo Error: Backend build failed. Cannot proceed with packaging.
        pause
        exit /b 1
    )
)

echo.
echo [2/3] Building React Frontend...
cd /d "%SCRIPT_DIR%..\frontend"
call npm.cmd run build
if %errorlevel% neq 0 (
    echo Error: Frontend build failed.
    pause
    exit /b 1
)

echo.
echo [3/3] Packaging Electron Desktop Application (electron-builder)...
cd /d "%SCRIPT_DIR%..\electron"
if not exist "node_modules" (
    echo Installing Electron dependencies...
    call npm.cmd install
)

call npm.cmd run dist
if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS: Smart Finance Manager packaged successfully!
    echo  Installer executable located in: electron\dist\
    echo ========================================================
) else (
    echo.
    echo ========================================================
    echo  ERROR: Packaging failed.
    echo ========================================================
    pause
    exit /b 1
)
