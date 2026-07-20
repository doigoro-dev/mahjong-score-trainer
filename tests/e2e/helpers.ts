import { expect, Page } from '@playwright/test';

export const SESSION_KEY = 'mahjongScoreTrainerVer1_4Session';

export async function openTrainer(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('question-number')).toContainText('第1問');
}

export async function showAnswer(page: Page): Promise<void> {
  await page.getByTestId('show-answer').click();
  await expect(page.getByTestId('answer-panel')).toBeVisible();
}

export async function goToNextQuestion(page: Page): Promise<void> {
  await page.getByTestId('next-question').click();
}

export async function completeSession(page: Page): Promise<void> {
  await openTrainer(page);

  for (let questionNumber = 1; questionNumber <= 100; questionNumber += 1) {
    await page.getByTestId('show-answer').click();
    await expect(page.getByTestId('answer-panel')).toBeVisible();

    const nextButton = page.getByTestId('next-question');
    await expect(nextButton).toBeVisible();

    if (questionNumber === 100) {
      await expect(nextButton).toHaveText('セッションを終了する');
    }

    await nextButton.click();
  }

  await expect(page.getByTestId('completion-panel')).toBeVisible();
}
