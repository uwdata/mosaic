import tseslint from 'typescript-eslint';

/** @type {import('@types/eslint').Linter.Config[]} */
export default tseslint.config(
  {
    files: ['**/*.ts', '**/*.js'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    linterOptions: { 'reportUnusedDisableDirectives': 'off' },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parser: tseslint.parser,
    },
    rules: {
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  }
);
