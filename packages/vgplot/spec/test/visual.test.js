import { test, expect } from '@playwright/test';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const specsDir = join(import.meta.dirname, '../../../../specs/json');

// Skip specs with very large remote datasets that can OOM the DuckDB server.
const skip = new Set([
  'flights-10m',
  'gaia',
  'linear-regression-10m',
  'nyc-taxi-rides',
  'observable-latency',
]);

const specFiles = (await readdir(specsDir))
  .filter(f => f.endsWith('.json'))
  .map(f => f.replace('.json', ''))
  .filter(f => !skip.has(f))
  .sort();

test.describe('Visual regression tests for JSON specs', () => {
  for (const specName of specFiles) {
    test(`renders ${specName} spec correctly`, async ({ page }) => {
      const specData = JSON.parse(await readFile(join(specsDir, `${specName}.json`), 'utf8'));

      await page.goto('http://localhost:5173/packages/vgplot/spec/test/visual-harness.html');
      await page.waitForFunction(() => typeof window.__renderSpec === 'function');
      await page.evaluate(spec => window.__renderSpec(spec), specData);

      const container = page.locator('#container');
      await expect(container).toHaveScreenshot(`${specName}.png`, { maxDiffPixelRatio: 0.05 });
    });
  }
});
