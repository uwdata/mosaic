import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';

async function main() {
  const yamlDir = join(process.cwd(), 'specs', 'yaml');
  const files = (await readdir(yamlDir)).filter(f => f.endsWith('.yaml'));
  const marks = new Set();
  const inputs = new Set();
  const directives = new Set();
  const layouts = new Set();
  for (const file of files) {
    const spec = parse(await readFile(join(yamlDir, file), 'utf8'));
    walk(spec);
  }
  console.log('marks', [...marks].sort());
  console.log('inputs', [...inputs].sort());
  console.log('directives', [...directives].sort());
  console.log('layouts', [...layouts].sort());

  function walk(node) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    if (node.mark) marks.add(node.mark);
    if (node.input) inputs.add(node.input);
    if (node.plot || node.vconcat || node.hconcat) {
      if (node.vconcat) layouts.add('vconcat');
      if (node.hconcat) layouts.add('hconcat');
      for (const k of Object.keys(node)) {
        if (!['plot', 'vconcat', 'hconcat'].includes(k) && typeof node[k] !== 'object') {
          directives.add(k);
        }
      }
    }
    Object.values(node).forEach(walk);
  }
}
main();
