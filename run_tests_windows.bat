@echo off
setlocal
cd /d "%~dp0"
call npm test
if errorlevel 1 (
  echo [ERROR] Tests failed.
  pause
  exit /b 1
)
echo [OK] All tests passed.
pause
exit /b 0
