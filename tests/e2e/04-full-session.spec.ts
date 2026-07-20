import { test, expect } from '@playwright/test';
import { openFresh, readState, collectConsoleErrors } from './helpers';

test.describe('100問回帰', () => {
  test('@smoke 全100問を重複なしで完走できる', async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await openFresh(page);
    const initial = await readState(page);
    expect(initial.order).toHaveLength(100);
    expect(new Set(initial.order).size).toBe(100);

    for (let i = 1; i <= 100; i += 1) {
      await expect(page.locator('#questionNumber')).toHaveText(`第${i}問（${i} / 100）`);
      await expect(page.locator('#completeHandContainer .tile-wrapper')).toHaveCount(14);
      await page.locator('#showAnswerButton').click();
      await expect(page.locator('#answerPanel')).toBeVisible();
      await page.locator('#nextQuestionButton').click();
    }

    await expect(page.locator('#completionPanel')).toBeVisible();
    await expect(page.locator('#questionNumber')).toHaveText('全100問終了');
    await expect(page.locator('#remainingCount')).toHaveText('残り0問');
    await expect(page.locator('#restartSessionButton')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('完了画面から再挑戦すると新しいセッションが始まる', async ({ page }) => {
    await openFresh(page);
    // 99問目の回答済み状態を直接構築し、最後の遷移だけUIで確認する。
    await page.evaluate(() => {
      const qs = (window as any).__mahjongTestApi.questions;
      const order = qs.map((q: any) => q.id);
      sessionStorage.setItem('mahjongScoreTrainerVer1_4Session', JSON.stringify({
        order, currentQuestionIndex: 99, answerShown: true, currentMode: 'normal', sessionVariations: {}
      }));
    });
    await page.reload();
    await expect(page.locator('#nextQuestionButton')).toHaveText('セッションを終了する');
    await page.locator('#nextQuestionButton').click();
    await expect(page.locator('#completionPanel')).toBeVisible();
    await page.locator('#restartSessionButton').click();
    await expect(page.locator('#questionNumber')).toHaveText('第1問（1 / 100）');
    await expect(page.locator('#completionPanel')).toBeHidden();
  });
});
