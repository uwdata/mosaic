#!/usr/bin/env node
import { basename, extname, join, resolve } from 'node:path';
import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { parseSpec, astToESM } from '@uwdata/mosaic-spec';
import { parse } from 'yaml';
import pgk from '../packages/spec/package.json' with { type: "json" };

// This script prepares all Mosaic example specifications
// ...AND WILL OVERWRITE EXISTING TEST CASE DATA AND DOCS!

// - Parsed AST JSON and ESM code written to /specs
// - YAML, non-parsed JSON, and ESM code written to /docs/public/specs
// - Example Markdown pages written to /docs/examples

const specDir = join('specs', 'yaml');
const esmTestDir = join('specs', 'esm');
const jsonTestDir = join('specs', 'json');
const tsTestDir = join('specs', 'ts');

const docsDir = 'docs';
const yamlDocsDir = join(docsDir, 'public', 'specs', 'yaml');
const jsonDocsDir = join(docsDir, 'public', 'specs', 'json');
const esmDocsDir = join(docsDir, 'public', 'specs', 'esm');
const exampleDir = join(docsDir, 'examples');

const specToTS = spec => {
  return `import { Spec } from '@uwdata/mosaic-spec';

export const spec : Spec = ${JSON.stringify(spec, 0, 2)};
`;
}

const files = await Promise.allSettled((await readdir(specDir))
  .filter(name => extname(name) === '.yaml')
  .map(async name => {
    const base = basename(name, '.yaml');
    const file = resolve(specDir, name);
    const text = await readFile(file, 'utf8');

    // parse spec and perform code generation
    // do this first to catch any errors
    const spec = parse(text);
    const ast = parseSpec(spec);
    const code = astToESM(ast);

    try {
      await Promise.all([
        // write ESM DSL spec to tests
        writeFile(resolve(esmTestDir, `${base}.js`), code),
        // write JSON spec to tests
        writeFile(
          resolve(jsonTestDir, `${base}.json`),
          JSON.stringify({
            $schema: `https://idl.uw.edu/mosaic/schema/v${pgk.version}.json`,
            ...ast.toJSON()
          }, 0, 2)
        ),
        // write TS JSON spec to tests
        writeFile(
          resolve(tsTestDir, `${base}.ts`),
          specToTS(spec)
        ),
        // copy YAML file to docs
        copyFile(file, resolve(yamlDocsDir, `${base}.yaml`)),
        // write JSON spec to docs
        writeFile(
          resolve(jsonDocsDir, `${base}.json`),
          JSON.stringify(spec, 0, 2)
        ),
        // write ESM DSL spec to docs
        writeFile(resolve(esmDocsDir, `${base}.js`), code),
        // write examples page to docs
        writeFile(
          resolve(exampleDir, `${base}.md`),
          examplePage(base, spec.meta)
        )
      ]);
    } catch (err) {
      console.error(err);
    }

    return base;
  })
);

// output successfully written examples
console.log(JSON.stringify(
  files
    .filter(x => x.status === 'fulfilled')
    .map(x => x.value),
  0, 2
));

// output unsuccessful example errors
files
  .filter(x => x.status === 'rejected')
  .forEach(x => console.error(x.reason));

function examplePage(spec, { title = spec, description, credit } = {}) {
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
:::
`;
}
