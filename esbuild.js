import process from 'node:process';
import * as esbuild from 'esbuild'

const name = process.argv[2];

function config(opt) {
  return {
    entryPoints: ['src/index.js'],
    target: ['esnext'],
    format: 'esm',
    bundle: true,
    ...opt
  };
}

await Promise.all([
  esbuild.build(config({ outfile: `dist/${name}.js` })),
  esbuild.build(config({ minify: true, outfile: `dist/${name}.min.js` }))
]);
