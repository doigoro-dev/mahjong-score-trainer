# 問題データ監査ツール

## 概要

麻雀点数計算トレーナーで利用している `questions.js` を監査するための開発者向けツールです。

## 配置場所

```text
mahjong-score-trainer/
├─ app/
├─ docs/
└─ question-audit-tool/
   ├─ index.html
   ├─ styles.css
   ├─ audit.js
   ├─ questions.js
   └─ README.md
```

現時点では、`app/questions.js` を `question-audit-tool/questions.js` へコピーして利用します。

## Version 0.2

- 問題データ読み込み
- 問題件数・問題ID一覧表示
- 監査処理と表示処理の分離
- 監査項目数・正常数・異常数・エラー件数表示
- 監査項目ごとのOK／NG表示
- エラー一覧表示
- 問題ID重複チェック

## 起動方法

1. `app/questions.js` を監査ツールのフォルダへコピーする
2. `index.html` をブラウザで開く
3. 「監査開始」を押す

## 問題ID重複チェック

同じ問題IDが複数登録されていないかを検査します。

例:

```text
q003 が 2件登録されています。
```

## 今後の予定

- 必須項目チェック
- `answer` と `management` の整合性チェック
- 翻数・符・点数チェック
- 役判定
