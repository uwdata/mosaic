# DuckDB Server

## Build

Build the release binary with

```sh
cargo build --release
```

## Develop

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
