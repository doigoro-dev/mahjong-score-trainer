@echo off
setlocal
cd /d "%~dp0"
call npm run test:smoke
if errorlevel 1 (
  echo [ERROR] Smoke tests failed.
  pause
  exit /b 1
)
echo [OK] Smoke tests passed.
pause
exit /b 0
