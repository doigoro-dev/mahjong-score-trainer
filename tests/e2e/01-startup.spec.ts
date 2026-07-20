import { test, expect } from '@playwright/test';
import { openTrainer } from './helpers';

test.describe('初期表示', () => {
  test.beforeEach(async ({ page }) => {
    await openTrainer(page);
  });

  test('第1問と残り99問を表示する', async ({ page }) => {
    await expect(page.getByTestId('question-number')).toHaveText('第1問（1 / 100）');
    await expect(page.getByTestId('remaining-count')).toHaveText('残り99問');
  });

  test('手牌14枚と問題情報を表示する', async ({ page }) => {
    await expect(page.getByTestId('complete-hand').locator('.tile-wrapper')).toHaveCount(14);
    await expect(page.getByTestId('question-info')).toContainText('和了方法');
    await expect(page.getByTestId('question-info')).toContainText('場風');
    await expect(page.getByTestId('question-info')).toContainText('自風');
  });

  test('通常モードが初期選択されている', async ({ page }) => {
    await expect(page.getByTestId('normal-mode')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('han-variation-mode')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('additional-condition-panel')).toBeHidden();
  });
});
