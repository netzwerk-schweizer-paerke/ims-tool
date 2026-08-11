import nextPlugin from '@next/eslint-plugin-next'
import checkFile from 'eslint-plugin-check-file'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import perfectionist from 'eslint-plugin-perfectionist'
import reactHooks from 'eslint-plugin-react-hooks'
import unicorn from 'eslint-plugin-unicorn'
import tseslint from 'typescript-eslint'

const config = [
  {
    ignores: [
      '.next/**',
      '.cache/**',
      '.logs/**',
      '.claude/**',
      '.yarn/**',
      'dist/**',
      'node_modules/**',
      // jest coverage output
      'coverage/**',
      // This project uses jest, not vitest (globe-website's equivalents are
      // vitest.config.ts / vitest.setup.ts / src/__tests__).
      '**/*.spec.ts',
      'jest.config.js',
      'src/tests/**',
      // Vendored third-party library — not ours to lint.
      'src/lib/xarrows/**',
      '**/importMap.js',
      'src/payload-types.ts',
      'src/migrations/**',
      'tsconfig.json',
      'package.json',
      '**/*.json',
      '**/*.scss',
    ],
  },
  ...tseslint.configs.recommended,
  perfectionist.configs['recommended-natural'],
  unicorn.configs.recommended,
  {
    rules: {
      // Unicorn rules disabled for this project (mirrors globe-website). The v68
      // bump renamed `prevent-abbreviations` -> `name-replacements` and added
      // several stricter rules; we keep the prior "no forced abbreviation
      // expansion / no churn" intent.
      'unicorn/consistent-boolean-name': 'off',
      'unicorn/consistent-class-member-order': 'off',
      'unicorn/consistent-function-scoping': 'off',
      'unicorn/filename-case': 'off',
      'unicorn/import-style': 'off',
      'unicorn/max-nested-calls': 'off',
      'unicorn/name-replacements': 'off',
      'unicorn/no-array-callback-reference': 'off',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-array-sort': 'off',
      'unicorn/no-break-in-nested-loop': 'off',
      'unicorn/no-computed-property-existence-check': 'off',
      'unicorn/no-declarations-before-early-exit': 'off',
      'unicorn/no-for-loop': 'off',
      'unicorn/no-immediate-mutation': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/no-nonstandard-builtin-properties': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-return-array-push': 'off',
      'unicorn/no-top-level-assignment-in-function': 'off',
      'unicorn/no-top-level-side-effects': 'off',
      'unicorn/no-unnecessary-global-this': 'off',
      'unicorn/no-unreadable-array-destructuring': 'off',
      'unicorn/no-unreadable-for-of-expression': 'off',
      'unicorn/no-unsafe-string-replacement': 'off',
      'unicorn/no-useless-template-literals': 'off',
      'unicorn/no-useless-undefined': 'off',
      'unicorn/prefer-add-event-listener': 'off',
      'unicorn/prefer-array-from-map': 'off',
      'unicorn/prefer-await': 'off',
      'unicorn/prefer-global-this': 'off',
      'unicorn/prefer-location-assign': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-number-coercion': 'off',
      'unicorn/prefer-single-call': 'off',
      'unicorn/prefer-spread': 'off',
      'unicorn/prefer-ternary': 'off',
      'unicorn/prefer-top-level-await': 'off',
      'unicorn/prefer-uint8array-base64': 'off',
      'unicorn/require-array-sort-compare': 'off',
    },
  },
  {
    // Relax unused-vars to a warning with the project's `_`/`ignored` escape
    // hatch (mirrors globe-website). Lint has no --max-warnings, so warnings
    // don't fail `yarn check`.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // DEVIATION from globe-website (which keeps this at tseslint's default
      // `error`): this codebase carries 253 pre-existing `any` sites, mostly in
      // the cloning utilities and the deeplTranslate plugin. Downgraded so
      // `yarn check` is usable; fix opportunistically, then restore to `error`
      // for full parity.
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^(_|ignored)',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^(_|ignored)',
        },
      ],
    },
  },
  {
    // React admin components + custom hooks (Payload admin UI) — hooks rules.
    // Includes `.ts` because custom hooks (use-*.ts) live outside JSX files.
    files: ['**/*.ts', '**/*.tsx', '**/*.jsx'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
    },
  },
  {
    // Next.js + accessibility rules — parity with the former
    // eslint-config-next/core-web-vitals coverage, minus its broken Babel
    // parser (we parse with typescript-eslint instead).
    files: ['**/*.tsx', '**/*.jsx'],
    plugins: {
      '@next/next': nextPlugin,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      // These three exceed the former eslint-config-next/core-web-vitals
      // coverage. Left off to keep parity; revisit to harden a11y.
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/html-has-lang': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
    },
  },
  {
    files: ['**/*.js', '**/*.ts', '**/*.tsx'],
    ignores: ['**/importMap.js'],
    plugins: {
      'check-file': checkFile,
    },
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        {
          '**/*.{js,ts,tsx}': 'KEBAB_CASE',
        },
        {
          ignoreMiddleExtensions: true,
        },
      ],
    },
  },
]

export default config
