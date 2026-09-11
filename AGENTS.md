## Comments in code

Match the style in my git history: comments are rare and load-bearing.

**Default to zero comments.** A 200-line change should typically have zero or one
comment. If code needs explaining, the fix is usually better naming or structure.

**A comment must explain something not visible in the code.** Valid reasons:
- An external system misbehaves and the code works around it — name the system and
  the misbehavior ("buildifier picks the foo/external/bar subdir as referring to
  /external, which is wrong").
- The approach is knowingly approximate or fragile — say so, and say what would
  break it.
- A non-obvious constraint forced this shape ("the bazel artifact store has the
  write bit removed, so we need to add it back").
- A link out: upstream source, a Discord thread, a docs page that explains the why.

**Never write:** comments restating what the next line does; section-header banners
over obvious blocks; "// Step 1 / Step 2" narration; explanations of language or
library features; a comment on every field or match arm.

**Do not add comments to code you didn't otherwise change.** If you're editing a
function, don't take the opportunity to document the rest of it.

## Commit messages

Subject: use Conventional Commits: `type: description` or
`type(scope): description`. Use `!` before the colon for a breaking change.
Common types in this repository are `feat`, `fix`, `docs`, `test`, `chore`, and
`ci`. Keep the description imperative, lowercase, and under ~70 chars. Don't
append a PR number; squash-merge adds it.

Body: default to one to three sentences of prose explaining *why*, or omit it
entirely for self-evident changes. Never bullet-list the diff — I can read the diff.
Write a longer body only when there's real external context: a link to the thread or
upstream issue that prompted it, measured before/after numbers, a checklist of what
must land first, or an enumeration of non-obvious cases the change handles.

## Documentation

After changing a public API, user-visible behavior, setup, or protocol, update
[`docs/`](docs/) in the same change. API reference pages are handwritten; exports
and source comments do not update them. Use the affected package's public entry
point as the documentation checklist.

For `@uwdata/mosaic-sql`, compare `packages/mosaic/sql/src/index.ts` with the
relevant page under `docs/api/sql/`; update `docs/sql/index.md` only for
guide-level behavior or examples. If a SQL API should also be available through
`@uwdata/vgplot`, check its selective re-exports in
`packages/vgplot/vgplot/src/api.js`. Keep parallel JavaScript and Python vgplot
docs aligned for shared APIs.

Navigation is manual. Add new pages to `docs/.vitepress/config.js`, and add new
API pages to `docs/api/index.md` as well.

`specs/yaml/*.yaml` is canonical for gallery examples; run `pnpm docs:examples`
and commit its generated docs and spec variants instead of editing them directly.
After schema-backed vgplot API changes, run `pnpm generate:python-api`; schema
descriptions also become generated Python docstrings. Do not run
`pnpm docs:schema` during normal development: it stages, commits, and pushes
published schemas.

Run `pnpm docs:build` for documentation changes because normal pull-request
checks do not build VitePress. Do not commit VitePress build/cache or generated
LLM output.
