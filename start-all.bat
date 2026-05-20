@echo off
echo ========================================
echo   GitHub Trending - Starting All
echo ========================================
echo.
echo Starting backend and frontend servers...
echo.

cd /d "%~dp0"

:: Start backend (server) in new window
start "GitHub Trending Backend" cmd /c "cd server && npm run dev"

:: Wait 1 second
timeout /t 1 /nobreak >nul

:: Start frontend in new window
start "GitHub Trending Frontend" cmd /c "cd frontend && npm run dev"

echo.
echo Both servers are starting in separate windows!
echo.
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo.
echo You can close this window now.
pause
