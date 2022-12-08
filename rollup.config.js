import bundleSize from 'rollup-plugin-bundle-size';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

function onwarn(warning, defaultHandler) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') {
    defaultHandler(warning);
  }
}

const name = 'vgplot';
const plugins = [
  bundleSize(),
  commonjs(),
  nodeResolve()
];

export default [
  {
    input: 'src/vgplot/index.js',
    plugins,
    onwarn,
    output: [
      {
        file: 'dist/vgplot.js',
        format: 'umd',
        name
      },
      {
        file: 'dist/vgplot.min.js',
        format: 'umd',
        sourcemap: true,
        plugins: [ terser() ],
        name
      }
    ]
  }
];
