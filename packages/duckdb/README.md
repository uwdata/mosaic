# mosaic-duckdb

A Promise-based Node.js API to DuckDB, along with a data server that supports transfer of [Apache Arrow](https://arrow.apache.org/) and JSON data over either Web Sockets or HTTP.

## Setup

The web server used HTTP2 so [you need to create a certificate](https://web.dev/how-to-use-local-https/).

The easiest way to do this is to use [mkcert](https://github.com/FiloSottile/mkcert):

```bash
brew install mkcert
brew install nss # if you use Firefox
```

Add mkcert to your local authority:

```bash
mkcert -install
```

Then create a certificate for localhost:

```bash
mkcert localhost
```
