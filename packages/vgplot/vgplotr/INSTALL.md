# Installation Guide for vgplotr

This guide explains how to build and install the vgplotr package.

## Prerequisites

You need the following installed on your system:

1. **R** (version 4.0 or later)
2. **Node.js** (version 18 or later) and npm
3. **Git** (to clone the repository)

### Check Prerequisites

```bash
# Check R
R --version

# Check Node.js
node --version  # Should be v18+

# Check npm
npm --version
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/uwdata/mosaic.git
cd mosaic/packages/vgplot/vgplotr
```

### 2. Install JavaScript Dependencies

```bash
npm install
```

This will install:
- Mosaic packages (@uwdata/mosaic-core, mosaic-spec, mosaic-sql)
- DuckDB WASM (@duckdb/duckdb-wasm)
- Build tools (esbuild)

### 3. Build the JavaScript Bundle

```bash
npm run build
```

This will:
- Bundle all JavaScript dependencies into a single file
- Copy DuckDB WASM files to `inst/htmlwidgets/lib/`
- Create `inst/htmlwidgets/vgplot.js`

You should see output like:
```
Build complete!
Copied duckdb-mvp.wasm
Copied duckdb-eh.wasm
Copied duckdb-browser-mvp.worker.js
Copied duckdb-browser-eh.worker.js
```

### 4. Install R Package Dependencies

Open R and run:

```r
install.packages(c("htmlwidgets", "jsonlite", "rlang"))
```

### 5. Install the Package

From the `vgplotr` directory:

```bash
R CMD INSTALL .
```

Or from within R:

```r
# From the vgplotr directory
install.packages(".", repos = NULL, type = "source")

# Or using devtools
devtools::install()
```

## Verify Installation

Test that the package loads correctly:

```r
library(vgplotr)

# Create a simple test plot
spec <- mosaic_spec(
  list(
    type = "exec",
    sql = "CREATE TABLE test AS SELECT range as x FROM range(100)"
  ),
  plot(
    rectY(
      from("test"),
      list(x = bin("x"), y = count(), fill = "steelblue")
    ),
    width = 600,
    height = 400
  )
)

vgplot(spec)
```

If you see an interactive histogram, the installation was successful!

## Development Mode

If you're developing the package:

### Watch Mode for JavaScript

```bash
npm run dev
```

This will watch for changes to `src/vgplot.js` and rebuild automatically.

### Reload R Package

In R:

```r
# Using devtools
devtools::load_all()

# Or
pkgload::load_all()
```

## Troubleshooting

### Issue: "Cannot find module '@uwdata/mosaic-core'"

**Solution**: Run `npm install` in the vgplotr directory.

### Issue: "Error: Widget output should be a list"

**Solution**: Make sure you built the JavaScript bundle with `npm run build`.

### Issue: "DuckDB WASM files not found"

**Solution**: The build script should copy WASM files automatically. If they're missing:

```bash
# Manually copy from node_modules
mkdir -p inst/htmlwidgets/lib/duckdb
cp node_modules/@duckdb/duckdb-wasm/dist/*.wasm inst/htmlwidgets/lib/duckdb/
cp node_modules/@duckdb/duckdb-wasm/dist/*.worker.js inst/htmlwidgets/lib/duckdb/
```

### Issue: "HTMLWidgets is not defined"

**Solution**: This means the htmlwidgets R package isn't loaded or the JavaScript bundle wasn't built correctly. Try:

1. Reinstall htmlwidgets: `install.packages("htmlwidgets")`
2. Rebuild JavaScript: `npm run build`
3. Reinstall R package: `R CMD INSTALL .`

### Issue: Build fails on Windows

**Solution**: Make sure you're using a recent version of Node.js (18+) and that you have build tools installed:

```bash
npm install --global windows-build-tools
```

### Issue: Package loads but widget shows error

Check the browser console (F12 in most browsers) for JavaScript errors. Common issues:

1. **CORS errors**: If loading data from URLs, the server must allow CORS
2. **Path issues**: Make sure DuckDB WASM files are in `inst/htmlwidgets/lib/duckdb/`
3. **Memory**: DuckDB WASM needs SharedArrayBuffer support (requires HTTPS or localhost)

## File Structure

After building, you should have:

```
vgplotr/
├── R/
│   ├── vgplot.R         # Main widget binding
│   └── api.R            # R API functions
├── inst/
│   └── htmlwidgets/
│       ├── vgplot.js    # Bundled JavaScript (generated)
│       ├── vgplot.yaml  # Widget configuration
│       └── lib/
│           └── duckdb/  # DuckDB WASM files (generated)
│               ├── duckdb-mvp.wasm
│               ├── duckdb-eh.wasm
│               └── *.worker.js
├── src/
│   └── vgplot.js        # JavaScript source
├── examples/
│   ├── getting-started.qmd
│   └── flights-demo.qmd
├── package.json         # npm dependencies
├── build.js            # Build script
└── DESCRIPTION         # R package metadata
```

## Next Steps

- Try the [getting started example](examples/getting-started.qmd)
- Explore the [flights demo](examples/flights-demo.qmd)
- Read the [README](README.md) for API documentation
- Report issues on [GitHub](https://github.com/uwdata/mosaic/issues)

## Uninstall

To remove the package:

```r
remove.packages("vgplotr")
```

To clean build artifacts:

```bash
npm run clean
rm -rf node_modules
```
