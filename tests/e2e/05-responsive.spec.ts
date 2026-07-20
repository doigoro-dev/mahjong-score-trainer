import { test, expect } from '@playwright/test';
import { openFresh } from './helpers';

const viewports = [
  { name: 'desktop-1440', width: 1440, height: 1000 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'iphone-390', width: 390, height: 844 },
  { name: 'android-360', width: 360, height: 800 },
  { name: 'narrow-320', width: 320, height: 700 }
];

test.describe('レスポンシブ表示', () => {
  for (const viewport of viewports) {
    test(`${viewport.name}で横スクロールせず14枚表示できる`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await openFresh(page);
      const metrics = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        stageWidth: document.querySelector('.stage')?.getBoundingClientRect().width ?? 0,
        handRight: document.querySelector('.complete-hand-row')?.getBoundingClientRect().right ?? 0,
        handLeft: document.querySelector('.complete-hand-row')?.getBoundingClientRect().left ?? 0
      }));
      expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.viewport + 1);
      expect(metrics.bodyWidth).toBeLessThanOrEqual(metrics.viewport + 1);
      expect(metrics.handLeft).toBeGreaterThanOrEqual(-1);
      expect(metrics.handRight).toBeLessThanOrEqual(metrics.viewport + 1);
      await expect(page.locator('#completeHandContainer .tile-wrapper')).toHaveCount(14);
      await page.screenshot({
        path: `test-results/screenshots/${viewport.name}.png`,
        fullPage: true
      });
    });
  }
});
