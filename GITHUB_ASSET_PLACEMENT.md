# GitHubリポジトリへの配置手順

このZIPは、既存の `mahjong-score-trainer` リポジトリへ上書きコピーするためのテスト資産です。

## コピーするもの

ZIPを展開し、次をリポジトリ直下へコピーしてください。

```text
tests/
scripts/
docs/testing/
package.json
package-lock.json
playwright.config.ts
run_tests_windows.bat
run_smoke_tests_windows.bat
```

## コピーしないもの

アプリ本体とプロジェクト紹介READMEは含めていません。
既存の次のファイルをそのまま使用します。

```text
app/index.html
README.md
docs/user-manual.html
```

## 推奨される最終構成

```text
mahjong-score-trainer/
├── app/
│   └── index.html
├── docs/
│   ├── user-manual.html
│   └── testing/
│       └── README.md
├── scripts/
│   ├── static-data-check.mjs
│   └── static-server.mjs
├── tests/
│   └── e2e/
│       ├── 01-smoke-and-navigation.spec.ts
│       ├── 02-session-and-modes.spec.ts
│       ├── 03-data-integrity.spec.ts
│       ├── 04-full-session.spec.ts
│       ├── 05-responsive.spec.ts
│       └── helpers.ts
├── package.json
├── package-lock.json
├── playwright.config.ts
├── run_tests_windows.bat
├── run_smoke_tests_windows.bat
└── README.md
```

## .gitignoreへの追記

既存の `.gitignore` に次がなければ追記してください。

```text
node_modules/
playwright-report/
test-results/
```
