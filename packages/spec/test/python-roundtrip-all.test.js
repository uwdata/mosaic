// Round-trip every canonical JSON spec through: JSON -> AST -> Python code -> Python runner -> JSON,
// and ensure we get byte-for-byte equality with the canonical fixtures.
import { describe, it, expect } from 'vitest';
import { readFile, readdir, mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseSpec } from '../src/parse-spec.js';
import { astToPython } from '../src/ast-to-python.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// Fixture locations and Python runner used to materialize the generated code.
const ROOT = join(process.cwd(), 'specs');
const JSON_DIR = join(ROOT, 'json');
const PY_RUNNER = join(process.cwd(), 'tests', 'tools', 'run_spec_file.py');

async function loadJSON(name) {
  const text = await readFile(join(JSON_DIR, `${name}.json`), 'utf8');
  return JSON.parse(text);
}

async function runPython(code) {
  // Write generated Python to a temp file and execute it via the runner,
  // which prints spec.to_dict() as JSON to stdout.
  const dir = await mkdtemp(join(tmpdir(), 'mosaic-pygen-'));
  const pyFile = join(dir, 'spec_gen.py');
  await writeFile(pyFile, code, 'utf8');
  const env = { ...process.env, PYTHONPATH: process.cwd() };
  const { stdout } = await execFileAsync('python', [PY_RUNNER, pyFile], { env });
  return JSON.parse(stdout);
}

describe('Python codegen round-trip (all specs)', () => {
  it('matches canonical JSON for every spec', async () => {
    const files = (await readdir(JSON_DIR)).filter(f => f.endsWith('.json'));
    for (const file of files) {
      const name = file.replace(/\.json$/, '');
      const specObj = await loadJSON(name);
      const ast = parseSpec(specObj);
      const pyCode = astToPython(ast);
      const regenerated = await runPython(pyCode);
      expect(regenerated).toEqual(specObj);
    }
  }, 180000);
});
