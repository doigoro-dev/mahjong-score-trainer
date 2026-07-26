# PROJECT_HANDBOOK.md

# Mahjong Score Trainer Project Handbook

> Last Updated: 2026-07-26

---

# プロジェクト概要

## プロジェクト名

Mahjong Score Trainer

## 目的

Mahjong Score Trainer は、麻雀の点数計算を素早く正確に行えるようになることを目的とした学習用 Web アプリである。

本プロジェクトは開発技術の習得を目的としたものではなく、実際の麻雀で点数計算が自然にできるようになることを最優先とする。

---

# 対象ユーザー

- 麻雀初心者
- 点数計算が苦手なプレイヤー
- 実戦前に練習したい人
- 符計算に苦手意識がある人

---

# 開発コンセプト

目指すのは

> 「実戦で迷わず点数計算ができるようになるトレーナー」

単なる問題集ではなく、

- 学ぶ
- 繰り返す
- 苦手を克服する

ことを支援するアプリとする。

---

# 基本方針

優先順位

1. 学習効果
2. 実戦に近い操作性
3. シンプルなUI
4. 保守性
5. 機能追加

---

# 技術スタック

## Frontend

- HTML5
- CSS3
- JavaScript

## 開発

- Git
- GitHub

## テスト

- Playwright

---

# フォルダ構成

```
mahjong-score-trainer/
├─ app/
├─ docs/
├─ question-audit-tool/
├─ scripts/
├─ tests/
├─ .github/
├─ README.md
└─ （その他設定ファイル）
```

※ `node_modules`、`playwright-report`、`test-results` などの生成物はプロジェクト構成の説明対象外とする。

---

# Git運用

## ブランチ

- main
- feature/*

機能開発は feature ブランチで行う。

完成後は Pull Request を経由して main へマージする。

---

# バージョニング

メジャーバージョンごとに機能追加を行う。

同一メジャーバージョン内では

- 3.0.x：バグ修正
- 3.1.x：改善・小規模機能追加

とする。

---

# リリース方針

- main は常に公開可能な状態を維持する。
- リリース時は Git Tag を作成する。
- GitHub Releases を作成する。
- README・ユーザーマニュアルを更新する。

---

# Versionごとの設計思想

## Version 1

### テーマ

点数計算に慣れることを最優先とする。

### 方針

- 必要最小限の機能
- 早期リリース
- 繰り返し練習できることを重視

---

## Version 2

### テーマ

実戦に近い練習を実現する。

### 方針

- 実戦モード
- リーチ選択
- ツモ・ロン選択
- ドラ表示
- タイマー
- 自動採点
- 苦手分野の重点練習

画像読み込み機能は将来候補とし、Version 2 の対象外とする。

---

## Version 3

### テーマ

継続利用しやすいアプリへ発展させる。

### 主な内容

- 問題選択・復習モード
- UI改善
- 保守性向上
- Version 3.0.0 正式リリース

## Version 3.0.1

### テーマ

検索エンジンやSNSから見つけやすいWebアプリへ改善する。

### 目的

GitHub Pagesで公開している麻雀点数計算トレーナーについて、
検索エンジン向けの基本情報を整備し、検索結果やSNS共有時に
アプリの内容が適切に伝わる状態を作る。

### 公開URL

https://doigoro-dev.github.io/mahjong-score-trainer/

### 対応予定

1. title最適化
2. meta description追加
3. canonical追加
4. OGP対応
5. favicon追加
6. robots.txt追加
7. sitemap.xml追加
8. Google Search Console登録

### 対象範囲

- `index.html` のSEO関連メタ情報
- GitHub Pages公開用の静的ファイル
- Google Search Consoleへの登録と確認

### 対象外

- 問題データや採点ロジックの変更
- 実戦モードなど既存機能の仕様変更
- 大規模なUI変更
- 広告やアクセス解析機能の導入

### Git運用

- 作業ブランチ：`feature/seo-v3.0.1`
- 各対応を小さな単位で実施する
- 動作確認後にPull Requestを作成する
- レビュー後に`main`へマージする
- `main`へのマージ後、GitHub Pagesへの反映を確認する

### 完了条件

- HTMLのSEOメタ情報がVersion 3.0.1の内容に更新されている
- canonical URLが公開URLと一致している
- OGP情報が設定されている
- faviconがブラウザで表示される
- robots.txtとsitemap.xmlへ公開URLからアクセスできる
- Google Search Consoleでサイト所有権を確認できる
- sitemap.xmlをGoogle Search Consoleへ送信できる
- 既存の点数計算機能に影響がない

---

# 今後のロードマップ

## Version 4

優先候補

- 副露対応
- 明槓対応
- 槓ドラ対応
- UI改善

---

## 将来構想

- 問題自動生成
- Question Audit Tool の高度化
- AI を活用した問題品質向上
- 学習履歴分析
- 苦手問題の自動出題

---

# ドキュメント構成

```
docs/
├─ PROJECT_HANDBOOK.md
├─ USER_MANUAL.html
├─ CHANGELOG.md（予定）
└─ TASKS.md（予定）
```

---

# 開発方針

- シンプルな設計を優先する。
- 学習効果を最優先とする。
- 過度な将来設計は行わない。
- 保守しやすいコードを維持する。
- バージョンごとに目的を明確化する。

---

# プロジェクト理念

> 点数計算を覚えるのではなく、
> 点数計算が自然にできるようになることを目指す。