import { test, expect } from '@playwright/test';
import { openTrainer } from './helpers';

test.describe('出題モード', () => {
  test('翻数変化モードへ切り替える', async ({ page }) => {
    await openTrainer(page);

    page.once('dialog', dialog => dialog.accept());
    await page.getByTestId('han-variation-mode').click();

    await expect(page.getByTestId('han-variation-mode')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('normal-mode')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByTestId('question-number')).toHaveText('第1問（1 / 100）');
    await expect(page.getByTestId('additional-condition-panel')).toBeVisible();
    await expect(page.getByTestId('additional-condition-text')).not.toBeEmpty();
  });

  test('モード切り替えをキャンセルすると通常モードを維持する', async ({ page }) => {
    await openTrainer(page);

    page.once('dialog', dialog => dialog.dismiss());
    await page.getByTestId('han-variation-mode').click();

    await expect(page.getByTestId('normal-mode')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('additional-condition-panel')).toBeHidden();
  });
});
