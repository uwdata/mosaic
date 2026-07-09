# Contributing to the vgplot Python API

Most of the API — every **mark** and **plot attribute** — is generated from the
Mosaic JSON schema, which is itself generated from the JavaScript spec ([`Spec.ts`]). 
The JS API is the source of truth.

Hand-written (not generated): the runtime core (`plot.py`, `spec.py`), data
sources (`data.py`), params (`params.py`), SQL encodings (`encodings.py`), and
the interactor / input / legend helpers.

[`Spec.ts`]: ../../../packages/vgplot/spec/src/spec/Spec.ts

## Regenerating the API

After any change to the vgplot spec types (or the generator), regenerate:

```sh
pnpm run generate:python-api
```

This rebuilds the schema, runs `bin/generate-python-api.js`, and formats the
output into `vgplot/_generated/`. Commit the regenerated files.

CI fails if the committed `vgplot/_generated/` output does not match a fresh
regeneration, so the generated code always matches the schema.

## Adding a new mark or attribute

Add it on the JS side ([`Spec.ts`]), then run `pnpm run generate:python-api`.
Nothing in the Python package needs hand-editing — there is no dynamic
fallback, so a name that is missing from the generated API raises
`AttributeError` (and is flagged by type checkers) rather than silently
appearing.

## Tests

```sh
cd packages/vgplot/vgplot-python
uv run --group dev pytest      # round-trip + API + schema-coverage tests
uv run --group dev ty check
```
