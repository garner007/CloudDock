@echo off
REM ─────────────────────────────────────────────────────────────────────────────
REM LocalStack Desktop — Windows Build Script
REM Usage: build.bat [win|all]
REM ─────────────────────────────────────────────────────────────────────────────

echo.
echo  ╔════════════════════════════════════════╗
echo  ║     LocalStack Desktop — Build         ║
echo  ╚════════════════════════════════════════╝
echo.

WHERE node >nul 2>nul || (echo [ERROR] Node.js is required. Install from https://nodejs.org && exit /B 1)
WHERE npm  >nul 2>nul || (echo [ERROR] npm is required. && exit /B 1)

IF NOT EXIST node_modules (
  echo [INFO] Installing dependencies...
  npm install --legacy-peer-deps || exit /B 1
)

IF NOT EXIST assets\icon.png (
  echo [INFO] Generating icons...
  node scripts\generate-icons.js
)

echo [INFO] Building React app...
set GENERATE_SOURCEMAP=false
call npx react-scripts build || exit /B 1

echo [INFO] Building Windows installer...
call npx electron-builder --win || exit /B 1

echo.
echo  ╔════════════════════════════════════════╗
echo  ║         Build Complete!                ║
echo  ╚════════════════════════════════════════╝
echo.
echo Installers are in: dist\
dir dist\ /B 2>nul
echo.
