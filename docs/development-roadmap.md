# Development Roadmap

## 1. Overview

本ドキュメントは、「麻雀点数計算トレーナー」の今後の開発計画を管理するためのロードマップです。

開発状況や今後の実装予定を整理し、各バージョンで何を目指すかを明確にすることを目的としています。

本ドキュメントは、設計書ではなく開発計画書です。
実装内容や優先順位は、開発状況に応じて変更される場合があります。

---

# 2. Development Policy

基本方針

- 小さな単位で機能を実装する
- 動作確認後にコミットする
- Versionごとにリリース可能な品質を維持する
- 学習効果を高める機能を優先する

優先順位

1. 学習体験の向上
2. UI / UX改善
3. 品質改善
4. 保守性向上

---

# 3. Version History

| Version | Status | Description |
|----------|--------|-------------|
| Version1 | Released | 基本機能 |
| Version2 | Released | 実戦モード・復習機能追加 |
| Version3 | Planning | 学習体験向上 |
| Version4+ | Future | 未定 |

---

# 4. Version2 Summary

Version2では、点数計算を実戦形式で学べるアプリとして大きく機能を拡張しました。

## 実装済み

### 学習モード

- Normal Mode
- Han Variation Mode
- Practical Mode
- Question Selection / Review Mode

---

### 実戦フロー

- リーチ選択
- ツモ・ロン選択
- ドラ表示
- 裏ドラ表示
- 自動採点
- タイマー

---

### 対応内容

- 一気通貫
- 三色同順
- 場風
- 自風
- 暗槓
- 複数暗槓
- ドラ
- 裏ドラ
- 赤ドラ
- 切り上げ満貫
- Session Restore
- Review Progress Restore

---

### 点数計算

- 親
- 子
- ツモ
- ロン
- ドラ
- 裏ドラ
- 赤ドラ
- 切り上げ満貫
- 暗槓
- 複数暗槓

---

### その他

- Session Restore
- IndexedDB改善
- 解説改善
- UI改善

---

### 品質

- Question Audit Tool Version1.0
- Playwright
- GitHub Actions
- Release Checklist

---

# 5. Version3

Version3では、新しい学習要素の追加よりも、

「学習効率を高める改善」

を優先します。

### 高優先

- 副露、明槓への対応
- 槓子ありの場合の表示ドラ数変更
- 苦手問題分析
- 出題アルゴリズム改善
- 学習履歴改善
- UI改善
- 解説改善

### 中優先

- 問題追加
- 統計情報追加

### 低優先

- デザイン改善
- 演出改善

---

# 6. Future Ideas

現時点では実装予定未定ですが、

将来的な候補として記録します。

- 新役追加
- 問題追加
- 学習支援機能
- 検索機能
- 復習支援

---

# 7. Deferred Features

優先度が低いため、

Version3では実装しない予定の機能です。

- 手牌画像読込
- AIによる役判定
- 外部麻雀アプリ画像読込
- クラウド同期
- オンラインランキング

必要性が高まった場合のみ再検討します。

---

# 8. Completed Milestones

## Version1

- 基本アプリ完成

## Version2

- 実戦モード完成
- 復習モード完成
- 問題117問
- Audit Tool完成
- Version2正式リリース

---

# 9. Maintenance

Version2以降は、

以下の流れで管理します。

```
Idea
 ↓

Backlog

 ↓

Planning

 ↓

Implementation

 ↓

Testing

 ↓

Release

 ↓

Maintenance
```

---

# 10. Change Log

## Version2

- Initial Version2 Release

今後はVersionアップごとに更新します。

---