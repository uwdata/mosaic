# DuckDB Server

## Developers

```sh
cargo install cargo-watch systemfd
```

Run with

```sh
systemfd --no-pid -s http::3000 -- cargo watch -x run
```

Or just (but this won't restart when the code changes)

```sh
cargo run
```
