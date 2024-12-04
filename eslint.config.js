import js from '@eslint/js';
import globals from 'globals';
import jsdoc from 'eslint-plugin-jsdoc';

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
        globalThis: false
      }
    },
    rules: {
      "no-unexpected-multiline": "off",
      "jsdoc/no-undefined-types": 1,
      "no-unused-vars": "off", // Disable the base no-unused-vars rule
      "@typescript-eslint/no-unused-vars": "off", // Disable the TypeScript-specific version if you are using TypeScript
    },
    plugins: {
      jsdoc
    }
  }
];
