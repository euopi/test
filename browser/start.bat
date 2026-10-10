@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js is required. Install it from https://nodejs.org and run this again. & pause & exit /b 1)
if not exist node_modules call npm install
start "" http://localhost:8080
node server.js
pause
