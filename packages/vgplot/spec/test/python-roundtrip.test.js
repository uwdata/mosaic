import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';
import { parseSpec } from '../src/parse-spec.js';
import { astToPython } from '../src/ast-to-python.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const ROOT = join(process.cwd(), 'specs');
const YAML_DIR = join(ROOT, 'yaml');
const JSON_DIR = join(ROOT, 'json');
const PY_RUNNER = join(process.cwd(), 'tests', 'tools', 'run_spec_file.py');

async function loadYAML(name) {
  const text = await readFile(join(YAML_DIR, `${name}.yaml`), 'utf8');
  return parse(text);
}

async function loadJSONFixture(name) {
  const text = await readFile(join(JSON_DIR, `${name}.json`), 'utf8');
  return JSON.parse(text);
}

async function runPython(code) {
  const dir = await mkdtemp(join(tmpdir(), 'mosaic-pygen-'));
  const pyFile = join(dir, 'spec_gen.py');
  await writeFile(pyFile, code, 'utf8');
  const env = { ...process.env, PYTHONPATH: process.cwd() };
  const { stdout } = await execFileAsync('python', [PY_RUNNER, pyFile], { env });
  return JSON.parse(stdout);
}

describe('Python codegen round-trip (all YAML specs)', () => {
  it('matches canonical JSON fixture for every YAML spec', async () => {
    const files = (await readdir(YAML_DIR)).filter(f => f.endsWith('.yaml'));
    for (const file of files) {
      const name = file.replace(/\.yaml$/, '');
      const yamlSpec = await loadYAML(name);
      const ast = parseSpec(yamlSpec);
      const pyCode = astToPython(ast);
      const generated = await runPython(pyCode);
      const fixture = await loadJSONFixture(name);
      expect(generated).toEqual(fixture);
    }
  }, 180000);
});
