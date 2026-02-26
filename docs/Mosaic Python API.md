# Mosaic Python API (vgplot Python API + Spec Codegen)

The Python API mirrors the Mosaic/VGPlot spec format and a JS-based generator that can emit readable Python code from Mosaic specs.

## Present State
The user can:
- Author Mosaic specs in Python using `import mosaic.vgplot as vg`.
- Generate Python code from existing Mosaic specs: spec -> AST -> Python -> spec.
- Validate correctness by round-tripping generated Python back to the canonical JSON fixtures.

## Repo Layout (Relevant Parts)

- Canonical specs:
  - `specs/yaml/` (human-authored source specs)
  - `specs/json/` (canonical JSON fixtures used for equality tests)
- JS spec parsing + codegen:
  - `packages/spec/src/parse-spec.js` (spec -> AST)
  - `packages/spec/src/ast-to-python.js` (AST -> Python)
  - `packages/spec/src/ast-to-esm.js` (AST -> JS ESM, already exists)
- Python (spec construction only):
  - `mosaic/vgplot/spec.py` (`vg.meta`, `vg.spec`, `Spec.to_dict()`)
  - `mosaic/vgplot/data.py` (`vg.data`, `vg.parquet`, `vg.table`)
  - `mosaic/vgplot/plot.py` (plot/layout/inputs/marks/directives)
  - `mosaic/vgplot/util.py` (snake_case -> lowerCamelCase, omit None)
- Python runner used by tests:
  - `tests/tools/run_spec_file.py` (exec a generated `.py` file, print JSON)
- Generated artifacts:
  - `specs/python-new/` (Python output generated from fixtures)

## Python API (User-Facing)

Import:

```python
import mosaic.vgplot as vg
```

### Spec & Meta

- `vg.meta(title=None, description=None, credit=None)`: convenience meta builder.
- `vg.spec(meta=None, data=None, params=None, plotDefaults=None, config=None, view=None, **extra)`: returns a `Spec`.
- `Spec.to_dict()`: returns the canonical Mosaic spec dict.
- `Spec.to_json(...)`: helper JSON serialization.

If a spec’s `meta` contains non-standard keys, the generator emits a literal dict so keys are preserved.

### Data

- `vg.parquet(file)`: returns `{"type": "parquet", "file": ...}`.
- `vg.table(query)`: returns `{"type": "table", "query": ...}`.
- `vg.data(**named_defs)`: returns a dict mapping dataset names to definitions.

If a data definition includes extra fields (for example `where`, `select`, `layer`, etc.), codegen preserves it by emitting a literal dict instead of `vg.parquet/ vg.table`.
In practice, `vg.parquet(...)` / `vg.table(...)` are emitted only for exact two-key definitions (`{type,file}` or `{type,query}`).

### Layout

- `vg.vconcat(*items)`: vertical stack.
- `vg.hconcat(*items)`: horizontal stack.
- `vg.vspace(px)`, `vg.hspace(px)`: spacing elements.

These return dict fragments (`{"vconcat": [...]}`, `{"hconcat": [...]}`) that serialize into the Mosaic spec.

### Inputs

- `vg.slider(...)`, `vg.select(...)`, `vg.checkbox(...)`: common controls.
- `vg.input(kind, **opts)`: fallback for other control types.

Reserved words are handled with Python-safe names:

- `as_` emits spec key `"as"`.
- `from_` emits spec key `"from"`.

### Plot, Marks, and Directives

- `vg.plot(*items)`: items can be marks or directives; returns `{"plot": [...], ...directives...}`.
- Marks:
  - Common helper functions: `vg.line_y`, `vg.bar_x`, `vg.area_y`, `vg.dot`, `vg.text`, `vg.density`, `vg.rule_x`, `vg.rule_y`, etc.
  - `vg.mark(name, data=None, **enc)`: generic explicit constructor for arbitrary mark names.
- Directives:
  - Common helper functions: `vg.x_axis`, `vg.y_grid`, `vg.margins(...)`, `vg.x_tick_format`, `vg.color_scale`, etc.
  - `vg.directive(key, value)`: generic explicit constructor for arbitrary directive keys.

Directive emission keeps `None` values (for example `xLabel: null`) to match the canonical fixtures.
For unmapped marks/directives, codegen emits snake_case calls (for example `vg.rect_y(...)`, `vg.xy_domain(...)`), which are resolved by `mosaic.vgplot.__getattr__` as dynamic mark/directive factories.

### Example: Airline Travelers

```python
import json
import mosaic.vgplot as vg

data = vg.data(
    travelers=vg.parquet("data/travelers.parquet"),
    endpoint=vg.table("SELECT * FROM travelers ORDER BY date DESC LIMIT 1"),
)

view = vg.plot(
    vg.rule_y([0]),
    vg.line_y(vg.from_("travelers"), x="date", y="previous", stroke_opacity=0.35),
    vg.line_y(vg.from_("travelers"), x="date", y="current"),
    vg.text(vg.from_("endpoint"), x="date", y="previous", text=["2019"], fill_opacity=0.5, line_anchor="bottom", dy=-6),
    vg.text(vg.from_("endpoint"), x="date", y="current", text=["2020"], line_anchor="top", dy=6),
    vg.y_grid(True),
    vg.y_label("↑ Travelers per day"),
    vg.y_tick_format("s"),
)

spec = vg.spec(
    meta=vg.meta(
        title="Airline Travelers",
        description="A labeled line chart comparing airport travelers in 2019 and 2020.",
        credit="Adapted from an Observable Plot example.",
    ),
    data=data,
    view=view,
)

if __name__ == "__main__":
    print(json.dumps(spec.to_dict(), sort_keys=True))
```

## Codegen: Spec/AST -> Python

The generator lives at `packages/spec/src/ast-to-python.js`.

High-level behavior:

- Input: Mosaic spec object parsed to AST by `parseSpec(...)`.
- Output: readable Python code that:
  - imports `mosaic.vgplot as vg`
  - builds `meta` (either `vg.meta(...)` or a literal dict)
  - builds `data` using `vg.parquet/ vg.table` when possible, else literal dicts
  - builds `view` using layout helpers and `vg.plot(...)`
  - assigns `spec = vg.spec(...)`
  - prints `spec.to_dict()` JSON in `__main__`
- Correctness strategy:
  - Prefer high-level helpers for readability.
  - Preserve semantics with fallbacks (`vg.input`, dynamic `vg.<snake_case>` mark/directive calls via `__getattr__`, or literal dicts) when a feature isn’t mapped.
  - Handle Python reserved words (`as` -> `as_`, `from` -> `from_`) for both inputs and mark encodings.
  - Emit `vg.from_(...)` only for pure `{ "from": ... }` references; if extra keys are present, keep the full object literal.
  - Preserve mixed plot arrays by emitting non-mark plot entries as literal objects.

## Testing & Verification

### Python Unit Tests (Python API -> JSON)

- `tests/test_vgplot_airline_travelers.py`
- `tests/test_vgplot_density2d.py`

These build specs using the Python API and compare `spec.to_dict()` to the canonical JSON fixtures.

### JS Integration Round-Trip (Fixtures)

These tests verify the full pipeline (fixture -> AST -> Python -> JSON):

- YAML fixtures:
  - `packages/spec/test/python-roundtrip.test.js`
  - Pipeline: YAML -> `parseSpec` -> `astToPython` -> run Python -> compare to `specs/json`
- JSON fixtures (all specs):
  - `packages/spec/test/python-roundtrip-all.test.js`
  - Pipeline: JSON -> `parseSpec` -> `astToPython` -> run Python -> compare to `specs/json`

### Python Runner Used by Integration Tests

- `tests/tools/run_spec_file.py`
- Executes a generated `.py` file, expects a global `spec`, calls `spec.to_dict()`, prints JSON to stdout.

## Commands (Local)

Run from repo root: `cd /Users/karthik/vscode/mosaic/mosaic`.

### Run Round-Trip Tests

```bash
npx vitest run packages/spec/test/python-roundtrip.test.js
npx vitest run packages/spec/test/python-roundtrip-all.test.js
python -m pytest tests/test_vgplot_airline_travelers.py tests/test_vgplot_density2d.py
```

### Generate Python Code for All Specs

This regenerates `specs/python-new/` from the canonical JSON fixtures:

```bash
rm -rf specs/python-new
mkdir -p specs/python-new
node --input-type=module - <<'NODE'
import { promises as fs } from 'fs';
import { join } from 'path';
import { parseSpec } from './packages/spec/src/parse-spec.js';
import { astToPython } from './packages/spec/src/ast-to-python.js';

const jsonDir = 'specs/json';
const outDir = 'specs/python-new';
const files = (await fs.readdir(jsonDir)).filter(f => f.endsWith('.json'));
for (const file of files) {
  const name = file.replace(/\.json$/, '');
  const text = await fs.readFile(join(jsonDir, file), 'utf8');
  const spec = JSON.parse(text);
  const ast = parseSpec(spec);
  const py = astToPython(ast);
  await fs.writeFile(join(outDir, `${name}.py`), py, 'utf8');
}
console.log(`Generated ${files.length} Python files into ${outDir}`);
NODE
```

### Run One Generated Python Spec and Print JSON

Make sure `mosaic/` is importable by setting `PYTHONPATH`:

```bash
PYTHONPATH=$(pwd) python tests/tools/run_spec_file.py specs/python-new/airline-travelers.py
```

## Notes / Limitations

- Helper coverage is intentionally hybrid: common features are pretty, long-tail features fall back to generic helpers/literal dicts to preserve correctness.
