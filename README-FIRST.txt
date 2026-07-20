麻雀点数計算トレーナー Ver1.6 テスト整理版

既存リポジトリへ、フォルダ構成を維持したまま上書きコピーしてください。

主な変更:
- app/index.html に data-testid を追加（機能ロジックは変更なし）
- Playwrightテストを5ファイルに整理
- scripts/static-data-check.mjs を追加
- package.json / playwright.config.ts / Windowsバッチを整理

実行:
1. npm install
2. npx playwright install chromium
3. npm test
