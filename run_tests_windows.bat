@echo off
setlocal
cd /d "%~dp0"
chcp 65001 >nul

echo ===============================================
echo 麻雀点数計算トレーナー Ver1.6 回帰テスト
echo ===============================================

where node >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js が見つかりません。
  echo https://nodejs.org/ からLTS版をインストールしてください。
  pause
  exit /b 1
)

if not exist node_modules (
  echo [1/3] npmパッケージをインストールします...
  call npm install
  if errorlevel 1 goto :error
)

echo [2/3] Chromiumのインストール状態を確認します...
call npx playwright install chromium
if errorlevel 1 goto :error

echo [3/3] 回帰テストを実行します...
call npx playwright test
if errorlevel 1 goto :failed

echo.
echo [SUCCESS] 全テストが完了しました。
echo HTMLレポートを開きます...
call npx playwright show-report playwright-report
exit /b 0

:failed
echo.
echo [FAILED] 失敗したテストがあります。
echo HTMLレポートを開きます...
call npx playwright show-report playwright-report
exit /b 1

:error
echo.
echo [ERROR] セットアップ中にエラーが発生しました。
pause
exit /b 1
