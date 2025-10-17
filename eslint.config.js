import globals from 'globals'
import pluginJs from '@eslint/js'

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        process: 'readonly',
        global: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
  pluginJs.configs.recommended,
  {
    ignores: ['.nyc*', 'node_modules/*', 'eslint*', '*.test.js'],
  },
  {
    rules: {
      'no-console': 'error',
      'no-debugger': 'error',
      'no-extra-boolean-cast': 'off',
      'no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      indent: [
        'error',
        2,
        {
          SwitchCase: 1,
          MemberExpression: 1,
          ImportDeclaration: 1,
          // VariableDeclarator: { var: 2, let: 2, const: 3 },
        },
      ],
    },
  },
]
