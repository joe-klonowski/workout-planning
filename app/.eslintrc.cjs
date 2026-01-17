module.exports = {
  env: {
    browser: true,
    es2021: true,
    jest: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:jest/recommended',
    'plugin:testing-library/react'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    'react',
    'react-hooks',
    'jsx-a11y',
    'jest',
    'testing-library'
  ],
  rules: {
    // Keep project-specific rule overrides here if needed

    // Allow new JSX transform (React not in scope)
    'react/react-in-jsx-scope': 'off',

    // Relax strict testing-library rules that cause test-suite failures
    'testing-library/no-node-access': 'off',
    'testing-library/no-container': 'off',
    'testing-library/no-unnecessary-act': 'off',
    'testing-library/no-wait-for-side-effects': 'off',
    'testing-library/no-wait-for-multiple-assertions': 'off',
    'testing-library/render-result-naming-convention': 'off',

    // Relax some jest rules
    'jest/no-conditional-expect': 'off',

    // Accessibility rules we can revisit later; warn instead of error for now
    'jsx-a11y/click-events-have-key-events': 'warn',
    'jsx-a11y/no-static-element-interactions': 'warn',

    // Prop-types are optional in this codebase
    'react/prop-types': 'off',

    // Prefer warnings for unused vars in tests
    'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],

    // Turn off or warn rules that we prefer not to block compilation for
    'testing-library/no-debugging-utils': 'off',
    'react/no-unescaped-entities': 'warn',
    'jsx-a11y/no-autofocus': 'off',
    'testing-library/prefer-screen-queries': 'off'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  ignorePatterns: ['node_modules/', 'build/', 'coverage/', 'public/']
};
