import { expect, Page } from '@playwright/test';

export const APP_URL = '/index.html';
export const STORAGE_KEY = 'mahjongScoreTrainerVer1_4Session';

export async function openFresh(page: Page): Promise<void> {
  await page.goto(APP_URL);
  await page.evaluate((key) => sessionStorage.removeItem(key), STORAGE_KEY);
  await page.reload();
  await expect(page.locator('#questionNumber')).toContainText('第1問');
}

export async function readState(page: Page): Promise<any> {
  return page.evaluate((key) => JSON.parse(sessionStorage.getItem(key) ?? 'null'), STORAGE_KEY);
}

export async function collectConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

export async function answerAndNext(page: Page): Promise<void> {
  await page.locator('#showAnswerButton').click();
  await expect(page.locator('#answerPanel')).toBeVisible();
  await page.locator('#nextQuestionButton').click();
}
