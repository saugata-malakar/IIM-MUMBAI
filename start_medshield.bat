@echo off
title MedShield Platform Launcher
echo.
echo ===================================================
echo    MedShield - Medical Data Anonymization Platform
echo ===================================================
echo.

REM Kill any old processes on our ports
echo [*] Cleaning up old processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8003" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /PID %%a /F >nul 2>&1
)
timeout /t 2 /nobreak >nul

echo [1/2] Starting Python FastAPI Backend (port 8003)...
start "MedShield-Backend" cmd /k "cd /d %~dp0 && python backend_api.py"

echo [2/2] Starting Next.js Frontend (port 3000)...
start "MedShield-Frontend" cmd /k "cd /d %~dp0\frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo ===================================================
echo    READY! Open your browser to:
echo.
echo    http://localhost:3000
echo.
echo ===================================================
echo.
pause
