/* eslint.config.cjs — a self-contained flat config that avoids the
 * `eslint-config-react-app` dependency and brings in recommended rules
 * from core and commonly used React/Jest plugins.
 */

const { configs } = require('@eslint/js');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const jestPlugin = require('eslint-plugin-jest');
const testingLibraryPlugin = require('eslint-plugin-testing-library');

module.exports = [
  // Base recommended JS rules
  configs.recommended,

  // Ignore build artifacts and coverage
  {
    ignores: ['node_modules/**', 'build/**', 'coverage/**', 'public/**'],
  },

  // React / JSX files
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
      jest: jestPlugin,
      'testing-library': testingLibraryPlugin,
    },
    // Merge the recommended rules from the plugins.
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      ...jestPlugin.configs.recommended.rules,
      ...(testingLibraryPlugin.configs?.recommended?.rules || {}),
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // Test files: enable Jest environment so globals (describe/it/expect/jest) are defined
  {
    files: ['**/*.test.js', '**/*.test.jsx', '**/*.spec.js', '**/*.spec.jsx'],
    languageOptions: {
      globals: {
        // Jest globals
        describe: 'readonly',
        test: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        jest: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',

        // Common browser and test environment globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        File: 'readonly',
        FormData: 'readonly',

        // Timer and Node globals used in tests
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        global: 'readonly',

        // Console/assertion helpers
        console: 'readonly',
        // Add more as needed
      },
    },
  },
];
