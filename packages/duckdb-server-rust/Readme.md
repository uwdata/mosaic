# DuckDB Server

A Rust-based server that runs a local DuckDB instance and support queries over Web Sockets or HTTP/HTTPS, returning data in either [Apache Arrow](https://arrow.apache.org/) or JSON format.

_Note:_ This package provides a local DuckDB server. To instead use DuckDB-WASM in the browser, use the `wasmConnector` in the [`mosaic-core`](https://github.com/uwdata/mosaic/tree/main/packages/mosaic-core) package.

## Usage

Install the server with Cargo.

```sh
cargo install duckdb-server
```

Then run the serve with 

```sh
duckdb-server
```

You can disable or customize logging with the `RUST_LOG` environment variable.

```sh
env RUST_LOG="" duckdb-server
```

The server can reuse existing sockets with `listenfd`.

```sh
systemfd --no-pid -s http::3000 -- duckdb-server
```

## Developers

### Build

Build the release binary with

```sh
cargo build --release
```

### Develop

To run the server and restart it when the code changes, install `cargo-watch` and `systemfd` with

```sh
cargo install cargo-watch systemfd
```

Then run the server with

```sh
systemfd --no-pid -s https::3000 -- cargo watch -x run
```

Or just use (but this won't restart when the code changes)

```sh
cargo run
```

Create certificates for HTTPS with

```sh
mkcert localhost
```

Before sending a pull request, run the tests with

```sh
cargo test
cargo clippy
cargo fmt
```

### Update dependencies

Update the lockfile with `cargo update` and look for outdated dependencies with [cargo-outdated](https://github.com/kbknapp/cargo-outdated) `cargo outdated -d 1`.
