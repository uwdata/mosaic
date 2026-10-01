# Mosaic servers

Mosaic includes [Node](duckdb/), [Rust](duckdb-server-rust/), [Go](duckdb-server-go/), and [Python](duckdb-server/) DuckDB servers. From the repository root, run `pnpm server:node`, `pnpm server:rust`, `pnpm server:go`, or `pnpm server` (Python). See each package for its runtime prerequisites and options.

## Local HTTPS and HTTP/2

Install [native mkcert](https://github.com/FiloSottile/mkcert#installation) on `PATH`, then run:

```sh
pnpm mkcert
pnpm server:node # or server:rust / server:go
```

`pnpm mkcert` runs `mkcert -install` and generates shared certificates for `localhost`, `127.0.0.1`, and `::1`. Trust installation may request administrator permission; see mkcert's instructions for system and browser prerequisites.

Connect to `https://localhost:3000`, or select **REST (HTTPS)** in the development gallery or query console. Node, Rust, and Go support HTTP/2 and HTTP/1.1 over HTTPS. Python's current server does not participate in this setup.

### Certificate locations

Servers look for a complete `localhost.pem` / `localhost-key.pem` pair in the working directory first, then the shared directory:

| Platform | Shared directory |
| --- | --- |
| macOS | `~/Library/Application Support/mosaic/https` |
| Linux | `${XDG_CONFIG_HOME:-~/.config}/mosaic/https` |
| Windows | `%AppData%\mosaic\https` |

To override the shared pair, place or mount both files in the server's working directory. To generate a local pair directly:

```sh
mkcert -install
mkcert -cert-file localhost.pem -key-file localhost-key.pem localhost 127.0.0.1 ::1
```

To renew shared certificates, rerun `pnpm mkcert`, then restart the server. Each invocation generates a new pair; servers only load certificates at startup.
