#!/usr/bin/env node
import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
// oxlint-disable no-magic-numbers no-use-before-define
// Prepares all Mosaic example specifications from YAML source files in specs/yaml/.
// WARNING: overwrites existing test case data and docs!
//
// Output:
//   - Parsed AST JSON, ESM, TypeScript, and Python written to /specs
//   - YAML, non-parsed JSON, ESM, and Python copied to /docs/public/specs
//   - Example Markdown pages written to /docs/examples
//
// Run: pnpm run docs:examples
import path from 'node:path';

import { parse } from 'yaml';

import { parseSpec, astToESM, astToPython } from '../src/index.js';

const rootDir = path.resolve(path.join('..', '..', '..'));
const specDir = path.join(rootDir, 'specs', 'yaml');
const esmTestDir = path.join(rootDir, 'specs', 'esm');
const jsonTestDir = path.join(rootDir, 'specs', 'json');
const tsTestDir = path.join(rootDir, 'specs', 'ts');
const pythonTestDir = path.join(rootDir, 'specs', 'python');

const docsDir = path.join(rootDir, 'docs');
const yamlDocsDir = path.join(docsDir, 'public', 'specs', 'yaml');
const jsonDocsDir = path.join(docsDir, 'public', 'specs', 'json');
const esmDocsDir = path.join(docsDir, 'public', 'specs', 'esm');
const exampleDir = path.join(docsDir, 'examples');
const pythonDocsDir = path.join(docsDir, 'public', 'specs', 'python');

let hadFailure = false;

function specToTS(spec): string {
  return `import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = ${JSON.stringify(spec, null, 2)};
`;
}

const files = await Promise.allSettled(
  // oxlint-disable-next-line unicorn/no-await-expression-member
  (await readdir(specDir))
    .filter((name) => path.extname(name) === '.yaml')
    .map(async (name) => {
      const base = path.basename(name, '.yaml');
      const file = path.join(specDir, name);
      const text = await readFile(file, 'utf8');

      // Parse spec and perform code generation
      // Do this first to catch any errors
      const spec = parse(text);
      const ast = parseSpec(spec);
      const code = astToESM(ast);
      const python = astToPython(ast);

      try {
        await Promise.all([
          // Write ESM DSL spec to tests
          writeFile(path.join(esmTestDir, `${base}.js`), code),
          // Write JSON spec to tests
          writeFile(
            path.join(jsonTestDir, `${base}.json`),
            // oxlint-disable-next-line unicorn/max-nested-calls
            JSON.stringify(ast.toJSON(), null, 2),
          ),
          // Write TS JSON spec to tests
          writeFile(path.join(tsTestDir, `${base}.ts`), specToTS(spec)),
          // Copy YAML file to docs
          copyFile(file, path.join(yamlDocsDir, `${base}.yaml`)),
          // Write JSON spec to docs
          writeFile(path.join(jsonDocsDir, `${base}.json`), JSON.stringify(spec, null, 2)),
          // Write ESM DSL spec to docs
          writeFile(path.join(esmDocsDir, `${base}.js`), code),
          // Write examples page to docs
          writeFile(path.join(exampleDir, `${base}.md`), examplePage(base, spec.meta)),
          // Write Python spec to tests
          writeFile(path.join(pythonTestDir, `${base}.py`), python),
          // Write Python spec to docs
          writeFile(path.join(pythonDocsDir, `${base}.py`), python),
        ]);
      } catch (error) {
        hadFailure = true;
        console.error(error);
      }

      return base;
    }),
);

// Output successfully written examples
console.log(
  JSON.stringify(
    files.filter((x) => x.status === 'fulfilled').map((x) => x.value),
    null,
    2,
  ),
);

// Output unsuccessful example errors
files
  .filter((x) => x.status === 'rejected')
  // oxlint-disable-next-line unicorn/no-array-for-each
  .forEach((x) => {
    hadFailure = true;
    console.error(x.reason);
  });

// Exit non-zero if any spec failed to generate
if (hadFailure) {
  process.exit(1);
}

// @ts-expect-error {description,credit} do not exist on `{title?: any}`
function examplePage(spec, { title = spec, description, credit } = {}): string {
  return `<script setup>
  import { coordinator } from '@uwdata/vgplot';
  coordinator().clear();
</script>

# ${title}
${description ? `\n${description.trim()}\n` : ''}
<Example spec="/specs/yaml/${spec}.yaml" />
${credit ? `\n**Credit**: ${credit}\n` : ''}
## Specification

::: code-group
<<< @/public/specs/esm/${spec}.js [JavaScript]
<<< @/public/specs/yaml/${spec}.yaml [YAML]
<<< @/public/specs/json/${spec}.json [JSON]
<<< @/public/specs/python/${spec}.py [Python]
:::
`;
}
