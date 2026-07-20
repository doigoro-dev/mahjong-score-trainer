import { test, expect } from '@playwright/test';
import { completeSession, openTrainer, SESSION_KEY, showAnswer } from './helpers';

test.describe('セッション管理', () => {
  test('リロード後も問題番号と回答表示状態を復元する', async ({ page }) => {
    await openTrainer(page);
    await showAnswer(page);
    await page.getByTestId('next-question').click();
    await showAnswer(page);

    await page.reload();

    await expect(page.getByTestId('question-number')).toHaveText('第2問（2 / 100）');
    await expect(page.getByTestId('answer-panel')).toBeVisible();
    await expect(page.getByTestId('next-question')).toBeVisible();
  });

  test('やり直し確認をキャンセルすると進捗を維持する', async ({ page }) => {
    await openTrainer(page);
    await showAnswer(page);
    await page.getByTestId('next-question').click();

    page.once('dialog', dialog => dialog.dismiss());
    await page.getByTestId('restart-from-beginning').click();

    await expect(page.getByTestId('question-number')).toHaveText('第2問（2 / 100）');
  });

  test('やり直し確認を承認すると第1問へ戻る', async ({ page }) => {
    await openTrainer(page);
    await showAnswer(page);
    await page.getByTestId('next-question').click();

    page.once('dialog', dialog => dialog.accept());
    await page.getByTestId('restart-from-beginning').click();

    await expect(page.getByTestId('question-number')).toHaveText('第1問（1 / 100）');
    await expect(page.getByTestId('remaining-count')).toHaveText('残り99問');
  });

  test('100問完了後に再挑戦すると新しいセッションが始まる', async ({ page }) => {
    test.setTimeout(60_000);
    await completeSession(page);

    await expect(page.getByTestId('completion-panel')).toContainText('全100問終了しました！');
    await expect(page.getByTestId('restart-session')).toHaveText('もう一度挑戦する');

    const storedAfterCompletion = await page.evaluate(key => sessionStorage.getItem(key), SESSION_KEY);
    expect(storedAfterCompletion).toBeNull();

    await page.getByTestId('restart-session').click();

    await expect(page.getByTestId('question-number')).toHaveText('第1問（1 / 100）');
    await expect(page.getByTestId('remaining-count')).toHaveText('残り99問');
    await expect(page.getByTestId('completion-panel')).toBeHidden();
  });
});
