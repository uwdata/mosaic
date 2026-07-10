# Contributing to Mosaic

Thanks for your interest in contributing to Mosaic! This guide covers how to set up a local development environment, run the test suite, and work on the documentation. For an overview of the repository's packages, see the [Repository Structure](README.md#repository-structure) section of the README.

Bug reports, feature requests, and questions are welcome via [GitHub issues](https://github.com/uwdata/mosaic/issues). For larger changes, please open an issue to discuss the design before sending a pull request.

## Prerequisites

- [Node.js](https://nodejs.org/) and [`pnpm`](https://pnpm.io/).
- [`uv`](https://docs.astral.sh/uv/) for the Python packages.
- A Rust toolchain and/or Go are only needed if you work on `duckdb-server-rust` or `duckdb-server-go`.

## Getting started

* Clone [https://github.com/uwdata/mosaic](https://github.com/uwdata/mosaic).
* Run `pnpm i` to install dependencies.
* Run `pnpm build` to build the client-side bundles.
* Run `pnpm test` to run the test suite.
* Run `uv sync` to install Python packages into `.venv` for local development (required for IDE import resolution in VS Code).
* Run `uv build --all-packages` to build the Python packages.

See the `scripts` in [`package.json`](package.json) for other available commands.

## Running examples locally

* Run `pnpm dev` to launch a local web server and view examples. By default, the examples use DuckDB-WASM in the browser. We recommend using Firefox since it remembers the selected dropdown across browser reloads.
* For greater performance, run `pnpm server` to launch the [`duckdb-server`](packages/server/duckdb-server) and connect to it from the examples. This runs the server in development mode, so the server restarts if you change its code.

## Documentation

The documentation site is built with [VitePress](https://vitepress.dev/) from the `docs/` directory. Run `pnpm docs:dev` for a dev server with hot reload, or `pnpm docs:build` and `pnpm docs:preview` to build and inspect the production site.

The production build also generates [LLM-friendly](https://llmstxt.org/) `llms.txt` and `llms-full.txt` files via [`vitepress-plugin-llms`](https://github.com/okineadev/vitepress-plugin-llms). These are only produced by `pnpm docs:build`, not by the dev server, and regenerate automatically from the docs pages — no manual edits needed.

## Generated files

Some files are generated and verified by CI, so don't edit them by hand. Change the source and regenerate instead, then commit the regenerated files together with your change:

* Example specs under `specs/` and `docs/public/specs`: run `pnpm docs:examples`.
* The generated Python vgplot API: run `pnpm generate:python-api` (see the [vgplot-python contributing guide](packages/vgplot/vgplot-python/CONTRIBUTING.md)).

## Before opening a pull request

Run `pnpm lint` and `pnpm test`, and regenerate any generated files your change affects. CI runs the full matrix of checks — JavaScript/TypeScript, Python, Rust, and Go — defined in [`.github/workflows/test.yml`](.github/workflows/test.yml); consult it for the exact commands if you want to reproduce a CI job locally.

## License

By contributing, you agree that your contributions will be licensed under the [BSD-3-Clause License](LICENSE).
