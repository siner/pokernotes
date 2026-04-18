import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

// Node.js globals (process, console, __dirname, etc.)
const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  Buffer: 'readonly',
  URL: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
};

// Browser + React globals
const browserGlobals = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  fetch: 'readonly',
  React: 'readonly',
  JSX: 'readonly',
};

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  // Base JS recommended rules
  js.configs.recommended,

  // All files: add Node + browser globals, relax no-undef
  {
    languageOptions: {
      globals: {
        ...nodeGlobals,
        ...browserGlobals,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  },

  // TypeScript source files (app, components, lib, i18n, tests, types)
  {
    files: ['app/**/*.ts', 'app/**/*.tsx', 'components/**/*.ts', 'components/**/*.tsx',
            'lib/**/*.ts', 'lib/**/*.tsx', 'i18n/**/*.ts', 'middleware.ts',
            'tests/**/*.ts', 'types/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  // Config files — TypeScript but without strict rules
  {
    files: ['*.config.ts', '*.config.mjs', '*.config.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: false },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      'no-console': 'off',
    },
  },

  // Scripts — Node.js CJS/ESM
  {
    files: ['scripts/**/*.mjs', 'scripts/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // Ignore build output and generated files
  {
    ignores: [
      '.next/**',
      '.open-next/**',
      'node_modules/**',
      'coverage/**',
      'playwright-report/**',
      'out/**',
      'next-env.d.ts',
      '**/*.d.ts',
    ],
  },
];

export default eslintConfig;


