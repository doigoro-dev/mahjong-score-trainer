import { test, expect } from '@playwright/test';
import { openFresh, readState, collectConsoleErrors } from './helpers';

test.describe('基本表示・画面遷移', () => {
  test('@smoke 初期表示が正しい', async ({ page }) => {
    const errors = await collectConsoleErrors(page);
    await openFresh(page);
    await expect(page).toHaveTitle(/麻雀点数計算トレーナー/);
    await expect(page.locator('h1')).toHaveText('麻雀点数計算トレーナー 100問版 Ver1.6');
    await expect(page.locator('#normalModeButton')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#hanVariationModeButton')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#remainingCount')).toHaveText('残り99問');
    await expect(page.locator('#completeHandContainer .tile-wrapper')).toHaveCount(14);
    await expect(page.locator('#showAnswerButton')).toBeVisible();
    await expect(page.locator('#nextQuestionButton')).toBeHidden();
    await expect(page.locator('#answerPanel')).toBeHidden();
    expect(errors).toEqual([]);
  });

  test('@smoke 答えを見ると回答が表示される', async ({ page }) => {
    await openFresh(page);
    await page.locator('#showAnswerButton').click();
    await expect(page.locator('#answerPanel')).toBeVisible();
    await expect(page.locator('#answerGrid .answer-item')).toHaveCount(5);
    await expect(page.locator('#answerGrid')).toContainText('役');
    await expect(page.locator('#answerGrid')).toContainText('翻');
    await expect(page.locator('#answerGrid')).toContainText('符');
    await expect(page.locator('#answerGrid')).toContainText('点数区分');
    await expect(page.locator('#answerGrid')).toContainText('点数');
    await expect(page.locator('#showAnswerButton')).toBeHidden();
    await expect(page.locator('#nextQuestionButton')).toBeVisible();
    await expect(page.locator('#thinkingMessage')).toBeHidden();
    expect((await readState(page)).answerShown).toBe(true);
  });

  test('次の問題へ進むと回答表示がリセットされる', async ({ page }) => {
    await openFresh(page);
    await page.locator('#showAnswerButton').click();
    await page.locator('#nextQuestionButton').click();
    await expect(page.locator('#questionNumber')).toHaveText('第2問（2 / 100）');
    await expect(page.locator('#remainingCount')).toHaveText('残り98問');
    await expect(page.locator('#answerPanel')).toBeHidden();
    await expect(page.locator('#showAnswerButton')).toBeVisible();
    await expect(page.locator('#nextQuestionButton')).toBeHidden();
    expect((await readState(page)).currentQuestionIndex).toBe(1);
    expect((await readState(page)).answerShown).toBe(false);
  });
});
