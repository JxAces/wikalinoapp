// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    files: ['components/three/**/*.{ts,tsx}'],
    rules: {
      'react/no-unknown-property': 'off',
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
