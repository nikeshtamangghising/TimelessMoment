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
      // Production-optimized ESLint configuration
      // This configuration prioritizes build success while maintaining code quality
      
      // Critical errors that should always be caught
      'no-debugger': 'error',
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      
      // TypeScript rules - relaxed for production builds
      '@typescript-eslint/no-unused-vars': [
        'warn', 
        { 
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn', // Warn but don't fail build
      '@typescript-eslint/no-require-imports': 'warn', // Warn for gradual migration
      '@typescript-eslint/triple-slash-reference': 'off', // Next.js generates these
      '@typescript-eslint/no-empty-object-type': 'off', // Allow empty interfaces
      
      // React rules - non-blocking warnings
      'react/no-unescaped-entities': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      
      // Next.js rules - warnings for optimization opportunities
      '@next/next/no-img-element': 'warn',
      
      // JavaScript rules
      'prefer-const': 'warn',
      'no-unused-vars': 'off', // Use TypeScript version instead
      'no-var': 'error', // Enforce let/const over var
      'eqeqeq': ['error', 'always'], // Require === and !==
    },
    
    // Environment-specific overrides
    languageOptions: {
      globals: {
        // Add any global variables your project uses
        React: 'readonly',
        JSX: 'readonly'
      }
    }
  }
];
