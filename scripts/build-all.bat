@echo off
echo ========================================================
echo  Full Production Build: Smart Finance Manager
echo ========================================================

set SCRIPT_DIR=%~dp0

echo Step 1: Building Backend Executable...
call "%SCRIPT_DIR%build-backend.bat"
if %errorlevel% neq 0 exit /b 1

echo.
echo Step 2: Packaging Electron Desktop Application...
call "%SCRIPT_DIR%build-electron.bat"
if %errorlevel% neq 0 exit /b 1

echo.
echo All builds completed successfully!
pause
