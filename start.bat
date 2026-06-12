@echo off

echo Killing processes on port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing PID %%a on port 3000
    taskkill /PID %%a /F > nul 2>&1
)

echo Killing processes on port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Killing PID %%a on port 5000
    taskkill /PID %%a /F > nul 2>&1
)

echo.
echo Starting backend...
start "Backend" cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 2 > nul

echo Starting frontend...
start "Frontend" cmd /k "cd /d %~dp0 && npm start"

echo.
echo All services started.