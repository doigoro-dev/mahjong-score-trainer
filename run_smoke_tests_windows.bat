@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul
if not exist node_modules call npm install
call npx playwright install chromium
call npx playwright test --grep @smoke
call npx playwright show-report playwright-report
