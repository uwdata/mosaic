// eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.mocha,
        ...globals.node,
        ...globals.es6,
        globalThis: false
      }
    },
    rules: {
      "no-unexpected-multiline": "off",
      "jsdoc/no-undefined-types": 1
    },
    plugins: {
      jsdoc
    }
  }
];
