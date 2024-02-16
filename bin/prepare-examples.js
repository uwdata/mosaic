#! /usr/bin/env node
import { basename, extname, join, resolve } from 'node:path';
import { copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { parseSpec, astToESM } from '@uwdata/mosaic-spec';
import { parse } from 'yaml';

const specDir = join('specs', 'yaml');

const docsDir = 'docs';
const yamlDir = join(docsDir, 'public', 'specs', 'yaml');
const jsonDir = join(docsDir, 'public', 'specs', 'json');
const esmDir = join(docsDir, 'public', 'specs', 'esm');
const exampleDir = join(docsDir, 'examples');

const files = await Promise.allSettled((await readdir(specDir))
  .filter(name => extname(name) === '.yaml')
  .map(async name => {
    const base = basename(name, '.yaml');
    const file = resolve(specDir, name);
    const text = await readFile(file, 'utf8');

    // parse spec and perform code generation
    // do this first to catch any errors
    const spec = parse(text);
    const code = astToESM(parseSpec(spec));

    try {
      // copy YAML file
      await copyFile(
        file,
        resolve(yamlDir, `${base}.yaml`)
      );

      // write JSON spec
      await writeFile(
        resolve(jsonDir, `${base}.json`),
        JSON.stringify(spec, 0, 2)
      );

      // write ESM DSL spec
      await writeFile(resolve(esmDir, `${base}.js`), code);

      // write examples page
      await writeFile(
        resolve(exampleDir, `${base}.md`),
        examplePage(base, spec.meta)
      );
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
