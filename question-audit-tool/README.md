# 問題データ監査ツール

## 概要

麻雀点数計算トレーナーで利用する `questions.js` を監査するための補助ツールです。

`app/questions.js` を `question-audit-tool/questions.js` にコピーして利用します。

## Version 0.8

監査項目は次の11項目です。

1. 問題ID重複チェック
2. 必須項目チェック
3. 翻数整合性チェック
4. 符整合性チェック
5. 点数カテゴリ整合性チェック
6. 切り上げ満貫整合性チェック
7. 役の翻数合計チェック
8. 役一覧整合性チェック
9. 点数カテゴリ計算チェック
10. 最終点数表示チェック
11. 牌コード・牌枚数チェック

## 牌コード・牌枚数チェック

### 有効な牌コード

数牌は次の形式です。

```text
1m ～ 9m
1p ～ 9p
1s ～ 9s
```

字牌は次の形式です。

```text
east
south
west
north
white
green
red
```

次の項目に含まれる牌コードを検証します。

- `concealedTiles`
- `winningTile`
- `concealedKans`（存在する場合）

### 和了形の構成枚数

通常問題では次の合計が14枚になることを確認します。

```text
concealedTilesの枚数
+ winningTileの1枚
+ concealedKansの組数 × 3枚
```

暗槓は物理的には4枚ですが、和了形の構成上は1面子なので3枚として換算します。

例：

```text
concealedTiles: 10枚
winningTile:     1枚
concealedKans:   1組 × 3枚
合計:            14枚
```

### 同一牌の上限

実際に使用する牌の枚数として、次を合計します。

```text
concealedTiles
+ winningTile
+ concealedKansの各牌を4枚
```

同一牌が5枚以上になった場合はエラーにします。

ドラ表示牌と裏ドラ表示牌はVer0.9で別途検証します。

## 最終点数表示チェック

次の項目から、ロン点またはツモ時の支払点を再計算します。

- `answer.fu`
- `answer.totalHan`
- `answer.score.category`
- `management.playerType`
- `winType`

`pointText`は再計算結果と完全一致する必要があります。

`display`は既存アプリの仕様に合わせ、次のどちらも正常とします。

```text
8000点
```

```text
満貫（8000点）
```

## 起動方法

1. `app/questions.js` を監査ツールのフォルダへコピーする
2. `index.html` をブラウザで開く
3. 「監査開始」を押す

## Ver1.0までの予定

このツールは補助的な位置づけとし、Ver1.0で一区切りとします。

- Ver0.9: ドラ・裏ドラの形式チェック
- Ver1.0: 最終整理
