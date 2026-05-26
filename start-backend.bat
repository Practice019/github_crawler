@echo off
echo ========================================
echo   GitHub Trending - Backend Server
echo ========================================
cd /d "%~dp0server"
echo Starting backend server on port 3000...
npm run dev
pause
