import js from '@eslint/js';
import globals from 'globals';

/** @type {import('@types/eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
        ...globals.es6,
        globalThis: false,
        TemplateStringsArray: true,
      }
    },
    rules: {
      "no-unexpected-multiline": "off",
    },
  }
];
