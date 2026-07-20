import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'スマートフォン', width: 375, height: 812 },
  { name: 'タブレット', width: 768, height: 1024 },
  { name: 'PC', width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`${viewport.name}幅で牌14枚が横にはみ出さない`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');

    await expect(page.getByTestId('complete-hand').locator('.tile-wrapper')).toHaveCount(14);

    const fits = await page.getByTestId('hand-stage').evaluate(element =>
      element.scrollWidth <= element.clientWidth
    );
    expect(fits).toBe(true);
  });
}
