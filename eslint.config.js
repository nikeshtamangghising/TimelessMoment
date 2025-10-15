const { FlatCompat } = require('@eslint/eslintrc');
const js = require('@eslint/js');
const path = require('path');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

module.exports = [
  {
    ignores: ['.next/**', 'node_modules/**', 'build/**', 'dist/**']
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      'react/no-unescaped-entities': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      '@next/next/no-img-element': 'warn'
    }
  }
];
