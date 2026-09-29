# Mosaic servers

Mosaic includes [Node](duckdb/), [Rust](duckdb-server-rust/), [Go](duckdb-server-go/), and [Python](duckdb-server/) DuckDB servers. From the repository root, run `pnpm server:node`, `pnpm server:rust`, `pnpm server:go`, or `pnpm server` (Python). See each package for its runtime prerequisites.

## Local HTTPS and HTTP/2

Node, Rust, and Go share localhost certificates. Set them up once:

```sh
pnpm mkcert
pnpm server:node # or server:rust / server:go
```

Connect to `https://localhost:3000` or `wss://localhost:3000`. The certificate also covers `127.0.0.1` and `::1`. HTTPS supports HTTP/2 and HTTP/1.1. Python's current server does not participate in this setup.

The helper uses [FiloSottile/mkcert](https://github.com/FiloSottile/mkcert) from `PATH`, or downloads a pinned, checksum-verified native binary into the OS user cache under `mosaic/mkcert`. This is not the npm package named `mkcert`; no Go installation is needed. Downloads and trust installation happen only when you run the helper.

Run setup in an interactive terminal: `mkcert -install` may request administrator permission. Linux needs its system trust-store utilities; Firefox and other NSS-based browser stores may need `certutil` (`brew install nss` or `apt install libnss3-tools`). See mkcert's installation instructions for platform details. Restart browsers if needed after installing trust.

### Shared files

| Platform | Directory |
| --- | --- |
| macOS | `~/Library/Application Support/mosaic/https` |
| Linux | `${XDG_CONFIG_HOME:-~/.config}/mosaic/https` |
| Windows | `%AppData%\mosaic\https` |

Each directory contains `localhost.pem` and `localhost-key.pem`. mkcert keeps its CA separately in the location reported by `mkcert -CAROOT`. Keep private keys private; only mount the server certificate/key pair into containers, not the CA key. Node clients may need `NODE_EXTRA_CA_CERTS` pointing to mkcert's `rootCA.pem` if their runtime does not use system trust.

### Lookup order

1. Go's explicit `--cert` and `--key`, supplied together.
2. A complete `localhost.pem` / `localhost-key.pem` pair in the current working directory.
3. For Rust, a complete pair at its compile-time `CARGO_MANIFEST_DIR`.
4. A complete pair in the shared directory above.

Incomplete pairs are skipped; files from different directories are never combined. An invalid selected pair fails startup. Without a pair, servers use plaintext HTTP/WebSockets. Rust retains its existing dual HTTP/HTTPS listener when certificates are present.

To override shared certificates, place or mount a pair in the working directory. `pnpm server:node` runs from the repository root; `server:rust` and `server:go` run from their package directories. PEM files are ignored throughout the repository.

### Renewal

Rerun `pnpm mkcert` to install trust and validate the shared pair. It reuses certificates with more than 30 days remaining and regenerates missing, invalid, mismatched, or near-expiry pairs. Restart running servers after renewal. Ordinary server startup only reads certificates.

The Go server additionally supports `--https`: it runs mkcert setup/renewal for the shared directory unless explicit or current-directory certificates override it. It uses mkcert on `PATH` or the verified cached binary from `pnpm mkcert`. Standalone Go users can install native mkcert without Node. Setup errors stop startup, and certificates are not renewed during TLS handshakes.

### Migrating Go's previous managed HTTPS

Go previously generated its own CA under `<user-config>/mosaic/duckdb-server-go/https`. Run `pnpm mkcert` or install native mkcert and run `duckdb-server-go --https` to switch. The old directory is left untouched and is no longer automatically loaded. After switching, you may remove "Mosaic localhost development CA" from system/browser trust stores and delete that old directory. Its `localhost.pem` contains a private key as well as a certificate.
