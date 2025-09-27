import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function getSpecFiles() {
  const specsJsonPath = join(__dirname, './specs.json');
  const specsJsonText = await readFile(specsJsonPath, 'utf8');
  return JSON.parse(specsJsonText);
}

const specFiles = await getSpecFiles();

test.describe('Visual regression tests for JSON specs', () => {
  for (const specName of specFiles) {
    test(`renders ${specName} spec correctly`, async ({ page }) => {
      const specPath = join(__dirname, '../../../../specs/json', `${specName}.json`);
      const specData = JSON.parse(await readFile(specPath, 'utf8'));

      await page.goto('http://localhost:5173/');

      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { margin: 0; padding: 20px; font-family: system-ui; background: white; }
            #container { display: inline-block; }
          </style>
        </head>
        <body>
          <div id="container"></div>
          <script type="module">
            import { DuckDBWASMConnector } from '/packages/mosaic/core/src/index.js';
            import { parseSpec, astToDOM } from '/packages/vgplot/spec/src/index.js';
            import { createAPIContext } from '/packages/vgplot/vgplot/src/index.js';

            async function renderSpec() {
              const vg = createAPIContext();
              const wasm = new DuckDBWASMConnector({ log: false });
              vg.coordinator().databaseConnector(wasm);

              const specData = ${JSON.stringify(specData)};
              const ast = parseSpec(specData);

              const { element } = await astToDOM(ast, {
                api: vg,
                baseURL: window.location.origin + '/'
              });

              document.getElementById('container').appendChild(element);
              document.body.setAttribute('data-render-complete', 'true');
            }

            renderSpec();
          </script>
        </body>
        </html>
      `);

      await page.waitForFunction(() =>
        document.body.hasAttribute('data-render-complete')
      );

      await page.waitForTimeout(1000);  // give mosaic some time to render
      await expect(page).toHaveScreenshot(`${specName}.png`, { maxDiffPixelRatio: 0.05 });
    });
  }
});
