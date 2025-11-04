import * as esbuild from 'esbuild';
import { promises as fs } from 'fs';
import path from 'path';

const watch = process.argv.includes('--watch');

async function copyDuckDBWASM() {
  const duckdbPath = path.dirname(await import.meta.resolve('@duckdb/duckdb-wasm'));
  const targetDir = 'inst/htmlwidgets/lib/duckdb';

  await fs.mkdir(targetDir, { recursive: true });

  const files = [
    'duckdb-mvp.wasm',
    'duckdb-eh.wasm',
    'duckdb-browser-mvp.worker.js',
    'duckdb-browser-eh.worker.js'
  ];

  for (const file of files) {
    try {
      await fs.copyFile(
        path.join(duckdbPath, '..', 'dist', file),
        path.join(targetDir, file)
      );
      console.log(`Copied ${file}`);
    } catch (err) {
      console.warn(`Warning: Could not copy ${file}:`, err.message);
    }
  }
}

async function build() {
  try {
    const ctx = await esbuild.context({
      entryPoints: ['src/vgplot.js'],
      bundle: true,
      format: 'iife',
      globalName: 'vgplotWidget',
      outfile: 'inst/htmlwidgets/vgplot.js',
      platform: 'browser',
      target: ['es2020'],
      sourcemap: true,
      minify: !watch,
      external: ['HTMLWidgets']
    });

    if (watch) {
      await ctx.watch();
      console.log('Watching for changes...');
    } else {
      await ctx.rebuild();
      await ctx.dispose();
      console.log('Build complete!');
    }

    // Copy DuckDB WASM files
    await copyDuckDBWASM();
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

build();
