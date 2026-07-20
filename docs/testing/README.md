# 自動テスト実行ガイド

このディレクトリは、麻雀点数計算トレーナーのPlaywright回帰テストに関する説明を管理します。

## 前提

- Node.js LTS版
- テスト対象: `app/index.html`

## Windowsでの実行

リポジトリ直下の次のファイルをダブルクリックします。

- `run_tests_windows.bat`: 全回帰テスト
- `run_smoke_tests_windows.bat`: 主要機能のみ

初回実行時は、npmパッケージとPlaywright用Chromiumをインストールします。

## コマンド

```text
npm test                 全テスト
npm run test:smoke      主要テスト
npm run test:data       データ整合性テスト
npm run test:responsive レスポンシブテスト
npm run test:static-data HTML内の問題データ静的検証
npm run report          前回のHTMLレポート表示
```

## テスト構成

```text
tests/e2e/
├── 01-smoke-and-navigation.spec.ts
├── 02-session-and-modes.spec.ts
├── 03-data-integrity.spec.ts
├── 04-full-session.spec.ts
├── 05-responsive.spec.ts
└── helpers.ts
```

## 主な検証内容

- 初期表示、回答表示、次問遷移
- sessionStorageによる途中再開
- やり直しとモード切替
- 不正な保存データからの復旧
- 100問のデータ整合性
- 点数再計算との一致
- 切り上げ満貫対象
- 100問の重複なし完走
- 320px～1440pxでのレスポンシブ表示
- 横スクロールの検出

## 結果の出力先

- HTMLレポート: `playwright-report/`
- 失敗時のトレース等: `test-results/artifacts/`
- レスポンシブ画像: `test-results/screenshots/`
