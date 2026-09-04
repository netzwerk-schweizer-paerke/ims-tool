A test file sits beside the module it tests, and its name is `<module>.test.ts`. Vitest collects
`src/**/*.test.ts`, which `vitest.config.ts` declares.

Import `describe`, `expect`, `test` and `vi` from `vitest`. This project sets no `globals` option, so
a bare `describe` does not resolve.

This folder holds the shared fixtures. Import them through `@/tests/mocks/test-utils`.

```bash
yarn test            # one run
yarn test:watch      # watch mode
yarn test:coverage   # v8 coverage into ./coverage
```
