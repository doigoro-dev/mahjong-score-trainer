import { test, expect } from '@playwright/test';
import { openFresh, readState, STORAGE_KEY, APP_URL } from './helpers';

test.describe('セッション・モード・やり直し', () => {
  test('リロード後も問題位置と回答表示状態を復元する', async ({ page }) => {
    await openFresh(page);
    await page.locator('#showAnswerButton').click();
    await page.locator('#nextQuestionButton').click();
    await page.locator('#showAnswerButton').click();
    const before = await readState(page);
    await page.reload();
    await expect(page.locator('#questionNumber')).toHaveText('第2問（2 / 100）');
    await expect(page.locator('#answerPanel')).toBeVisible();
    const after = await readState(page);
    expect(after.currentQuestionIndex).toBe(before.currentQuestionIndex);
    expect(after.order).toEqual(before.order);
  });

  test('やり直しのキャンセル時は進捗を維持する', async ({ page }) => {
    await openFresh(page);
    await page.locator('#showAnswerButton').click();
    await page.locator('#nextQuestionButton').click();
    const before = await readState(page);
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#restartFromBeginningButton').click();
    await expect(page.locator('#questionNumber')).toHaveText('第2問（2 / 100）');
    expect(await readState(page)).toEqual(before);
  });

  test('やり直しを承認すると第1問に戻り再シャッフルされる', async ({ page }) => {
    await openFresh(page);
    const initial = await readState(page);
    await page.locator('#showAnswerButton').click();
    await page.locator('#nextQuestionButton').click();
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#restartFromBeginningButton').click();
    const restarted = await readState(page);
    await expect(page.locator('#questionNumber')).toHaveText('第1問（1 / 100）');
    expect(restarted.currentQuestionIndex).toBe(0);
    expect(restarted.answerShown).toBe(false);
    expect(restarted.order).not.toEqual(initial.order);
  });

  test('翻数変化モードへの切替をキャンセルできる', async ({ page }) => {
    await openFresh(page);
    page.once('dialog', dialog => dialog.dismiss());
    await page.locator('#hanVariationModeButton').click();
    await expect(page.locator('#normalModeButton')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#additionalConditionPanel')).toBeHidden();
  });

  test('@smoke 翻数変化モードへ切り替えると付加条件が表示される', async ({ page }) => {
    await openFresh(page);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#hanVariationModeButton').click();
    await expect(page.locator('#hanVariationModeButton')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#normalModeButton')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#additionalConditionPanel')).toBeVisible();
    await expect(page.locator('#additionalConditionText')).not.toBeEmpty();
    const state = await readState(page);
    expect(state.currentMode).toBe('hanVariation');
    expect(Object.keys(state.sessionVariations)).toHaveLength(100);
  });

  test('不正なsessionStorageは破棄して新規セッションを開始する', async ({ page }) => {
    await page.goto(APP_URL);
    await page.evaluate(({ key }) => sessionStorage.setItem(key, '{invalid-json'), { key: STORAGE_KEY });
    await page.reload();
    await expect(page.locator('#questionNumber')).toHaveText('第1問（1 / 100）');
    const state = await readState(page);
    expect(state.order).toHaveLength(100);
    expect(new Set(state.order).size).toBe(100);
  });
});
