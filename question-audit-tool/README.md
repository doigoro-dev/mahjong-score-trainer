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

## Version 0.3

実装内容:

- 問題データ読み込み
- 問題件数・問題ID一覧表示
- 監査項目を関数配列で管理
- 問題ID重複チェック
- 必須項目チェック
- 監査項目数・正常数・異常数・エラー件数表示
- 監査項目ごとのOK／NG表示
- エラー一覧表示

## 監査項目の管理

監査関数は `AUDIT_CHECKS` 配列で管理します。

```javascript
const AUDIT_CHECKS = [
  checkDuplicateIds,
  checkRequiredFields
];
```

今後は監査関数を作成し、この配列へ追加することで監査項目を増やします。

## 必須項目チェック

現在の `questions.js` の問題形式に必要な項目が存在するかを確認します。

主な対象:

- 問題ID
- 手牌
- 和了牌
- 和了方法
- 場風・自風
- 立直・門前
- 正解の役・翻数・符・点数
- 符内訳
- 管理用メタデータ
- 表ドラ表示牌
- 裏ドラ表示牌

`false`、`0`、空文字、空配列は、項目自体が存在すれば欠落とは判定しません。

## 起動方法

1. `app/questions.js` を監査ツールのフォルダへコピーする
2. `index.html` をブラウザで開く
3. 「監査開始」を押す

## 今後の予定

- 必須項目の型チェック
- `answer` と `management` の整合性チェック
- 翻数・符・点数チェック
- 牌コード・手牌枚数チェック
- 役判定
