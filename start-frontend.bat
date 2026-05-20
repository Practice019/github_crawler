@echo off
echo ========================================
echo   GitHub Trending - Frontend Server
echo ========================================
cd /d "%~dp0frontend"
echo Starting frontend server on port 5173...
npm run dev
pause
