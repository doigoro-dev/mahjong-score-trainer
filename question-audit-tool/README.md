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

## Version 0.4

実装内容:

- 問題ID重複チェック
- 必須項目チェック
- 翻数整合性チェック
- 符整合性チェック
- 点数カテゴリ整合性チェック
- 切り上げ満貫整合性チェック
- 監査項目ごとのOK／NG表示
- エラー一覧表示

## 整合性チェック

次の値が一致しているかを確認します。

```text
answer.totalHan
management.han
```

```text
answer.fu
management.fu
```

```text
answer.score.category
management.scoreCategory
```

```text
answer.score.kiriageMangan
management.kiriageMangan
```

不一致がある場合は、問題IDと両方の値を表示します。

例:

```text
q101: answer.totalHan=5 / management.han=4
```

欠落項目は必須項目チェックで検出するため、整合性チェックでは両方の値が存在する場合のみ比較します。

## 監査項目の追加方法

監査関数を作成し、`AUDIT_CHECKS` 配列へ追加します。

```javascript
const AUDIT_CHECKS = [
  checkDuplicateIds,
  checkRequiredFields,
  checkHanConsistency
];
```

## 起動方法

1. `app/questions.js` を監査ツールのフォルダへコピーする
2. `index.html` をブラウザで開く
3. 「監査開始」を押す

## 今後の予定

- `answer.yaku` の翻数合計チェック
- `answer.yaku` と `management.mainYaku` の整合性チェック
- プレイヤー種別・和了方法の整合性チェック
- 点数表示項目の整合性チェック
- 牌コード・手牌枚数チェック
- 役判定
