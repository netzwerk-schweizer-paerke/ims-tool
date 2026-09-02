// Next types NODE_ENV as read-only. The runtime value is a plain object property, and the
// module under test reads it at import time, so the test must set it before it loads.
const mutableEnv = process.env as Record<string, string | undefined>

const loadEnvironment = (nodeEnv: string | undefined) => {
  const previous = mutableEnv.NODE_ENV

  if (nodeEnv === undefined) {
    delete mutableEnv.NODE_ENV
  } else {
    mutableEnv.NODE_ENV = nodeEnv
  }

  let environment!: typeof import('@/lib/environment')
  jest.isolateModules(() => {
    environment = require('@/lib/environment')
  })

  mutableEnv.NODE_ENV = previous
  return environment
}

describe('isLocalDevelopment', () => {
  // The dev seed creates a super admin with a published password. This predicate is the
  // only thing that keeps it out of a deployed database.
  test('is true only on a local dev server', () => {
    expect(loadEnvironment('development').isLocalDevelopment).toBe(true)
  })

  test.each([
    ['production', 'production'],
    ['staging, which a Docker build arg can set', 'staging'],
    ['test', 'test'],
    ['an unset value, which is how an ops script runs', undefined],
  ])('is false for %s', (_label, nodeEnv) => {
    expect(loadEnvironment(nodeEnv).isLocalDevelopment).toBe(false)
  })
})

describe('isDevelopment', () => {
  // It is the negation of production, so it is true for staging too. `logger.ts` wants that
  // meaning. Never gate a destructive side effect on it.
  test.each([
    ['development', 'development', true],
    ['staging', 'staging', true],
    ['an unset value', undefined, true],
    ['production', 'production', false],
  ])('is %s for %s', (_label, nodeEnv, expected) => {
    expect(loadEnvironment(nodeEnv).isDevelopment).toBe(expected)
  })
})
