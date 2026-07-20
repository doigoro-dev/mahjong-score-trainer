import { test, expect } from '@playwright/test';
import { openTrainer, showAnswer } from './helpers';

test.describe('回答表示', () => {
  test.beforeEach(async ({ page }) => {
    await openTrainer(page);
  });

  test('答えを見ると正解欄を表示する', async ({ page }) => {
    await showAnswer(page);

    await expect(page.getByTestId('answer-grid')).toContainText('役');
    await expect(page.getByTestId('answer-grid')).toContainText('翻');
    await expect(page.getByTestId('answer-grid')).toContainText('符');
    await expect(page.getByTestId('answer-grid')).toContainText('点数');
    await expect(page.getByTestId('answer-explanation')).toContainText('符・点数の内訳');
  });

  test('回答表示後は答えボタンを隠して次の問題ボタンを表示する', async ({ page }) => {
    await showAnswer(page);

    await expect(page.getByTestId('show-answer')).toBeHidden();
    await expect(page.getByTestId('next-question')).toBeVisible();
    await expect(page.getByTestId('next-question')).toHaveText('次の問題');
    await expect(page.getByTestId('thinking-message')).toBeHidden();
  });

  test('次の問題へ進むと進捗が更新される', async ({ page }) => {
    await showAnswer(page);
    await page.getByTestId('next-question').click();

    await expect(page.getByTestId('question-number')).toHaveText('第2問（2 / 100）');
    await expect(page.getByTestId('remaining-count')).toHaveText('残り98問');
    await expect(page.getByTestId('show-answer')).toBeVisible();
    await expect(page.getByTestId('answer-panel')).toBeHidden();
  });
});
