import { test, expect } from '@playwright/test';
import { openFresh } from './helpers';

test.describe('100問データ整合性', () => {
  test.beforeEach(async ({ page }) => openFresh(page));

  test('問題数・ID・牌枚数・基本項目が正しい', async ({ page }) => {
    const result = await page.evaluate(() => {
      const qs = (window as any).__mahjongTestApi.questions;
      return {
        count: qs.length,
        ids: qs.map((q: any) => q.id),
        invalidTileCounts: qs.filter((q: any) => q.concealedTiles.length !== 13 || !q.winningTile).map((q: any) => q.id),
        invalidWinTypes: qs.filter((q: any) => !['ron', 'tsumo'].includes(q.winType)).map((q: any) => q.id),
        invalidWinds: qs.filter((q: any) => !['east','south','west','north'].includes(q.roundWind) || !['east','south','west','north'].includes(q.seatWind)).map((q: any) => q.id)
      };
    });
    expect(result.count).toBe(100);
    expect(new Set(result.ids).size).toBe(100);
    expect(result.invalidTileCounts).toEqual([]);
    expect(result.invalidWinTypes).toEqual([]);
    expect(result.invalidWinds).toEqual([]);
  });

  test('役の翻数合計・management情報・点数再計算が一致する', async ({ page }) => {
    const problems = await page.evaluate(() => {
      const qs = (window as any).__mahjongTestApi.questions;
      const calc = (window as any).__mahjongTestApi.calculateScoreFromFuHan;
      return qs.flatMap((q: any) => {
        const errors: string[] = [];
        const yakuHan = q.answer.yaku.reduce((sum: number, y: any) => sum + y.han, 0);
        if (yakuHan !== q.answer.totalHan) errors.push(`役翻合計 ${yakuHan} != ${q.answer.totalHan}`);
        if (q.management.fu !== q.answer.fu) errors.push('management.fu不一致');
        if (q.management.han !== q.answer.totalHan) errors.push('management.han不一致');
        if (q.management.scoreCategory !== q.answer.score.category) errors.push('点数区分不一致');
        if (q.management.kiriageMangan !== q.answer.score.kiriageMangan) errors.push('切り上げ満貫不一致');
        const recalculated = calc(q, q.answer.totalHan);
        if (recalculated.pointText !== q.answer.score.pointText) errors.push(`点数 ${recalculated.pointText} != ${q.answer.score.pointText}`);
        if (recalculated.category !== q.answer.score.category) errors.push(`区分 ${recalculated.category} != ${q.answer.score.category}`);
        return errors.length ? [{ id: q.id, errors }] : [];
      });
    });
    expect(problems).toEqual([]);
  });

  test('符別構成と切り上げ満貫対象が品質保証コメントと一致する', async ({ page }) => {
    const summary = await page.evaluate(() => {
      const qs = (window as any).__mahjongTestApi.questions;
      const fuCounts: Record<string, number> = {};
      qs.forEach((q: any) => { fuCounts[q.answer.fu] = (fuCounts[q.answer.fu] ?? 0) + 1; });
      return {
        fuCounts,
        kiriageIds: qs.filter((q: any) => q.answer.score.kiriageMangan).map((q: any) => q.id)
      };
    });
    expect(summary.fuCounts).toEqual({ '20': 10, '25': 10, '30': 20, '40': 20, '50': 15, '60': 25 });
    expect(summary.kiriageIds).toEqual(['q026','q030','q081','q085','q086','q090','q091','q095','q096','q100']);
  });

  test('翻数変化パターンは全問で生成でき、条件の翻数と合計が一致する', async ({ page }) => {
    const errors = await page.evaluate(() => {
      const qs = (window as any).__mahjongTestApi.questions;
      const create = (window as any).__mahjongTestApi.createVariationPatternsForQuestion;
      return qs.flatMap((q: any) => {
        const patterns = create(q);
        const list: string[] = [];
        if (!Array.isArray(patterns) || patterns.length === 0) list.push('候補なし');
        patterns.forEach((p: any, i: number) => {
          const extra = p.conditions.reduce((sum: number, c: any) => sum + c.han, 0);
          if (q.answer.totalHan + extra !== p.totalHan) list.push(`候補${i + 1}: 翻数不一致`);
          if (!p.score?.pointText || !p.score?.category) list.push(`候補${i + 1}: 点数なし`);
        });
        return list.length ? [{ id: q.id, errors: list }] : [];
      });
    });
    expect(errors).toEqual([]);
  });
});
