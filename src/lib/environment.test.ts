import { describe, expect, test, vi } from 'vitest'

// Next types NODE_ENV as read-only. The runtime value is a plain object property, and the
// module under test reads it at import time, so the test must set it before it loads.
const mutableEnv = process.env as Record<string, string | undefined>

const loadEnvironment = async (nodeEnv: string | undefined) => {
  const previous = mutableEnv.NODE_ENV

  if (nodeEnv === undefined) {
    delete mutableEnv.NODE_ENV
  } else {
    mutableEnv.NODE_ENV = nodeEnv
  }

  // `resetModules` drops the registry, so the next import re-runs the module body.
  vi.resetModules()
  const environment = await import('@/lib/environment')

  mutableEnv.NODE_ENV = previous
  return environment
}

describe('isLocalDevelopment', () => {
  // The dev seed creates a super admin with a published password. This predicate is the
  // only thing that keeps it out of a deployed database.
  test('is true only on a local dev server', async () => {
    const environment = await loadEnvironment('development')

    expect(environment.isLocalDevelopment).toBe(true)
  })

  test.each<[string, string | undefined]>([
    ['production', 'production'],
    ['staging, which a Docker build arg can set', 'staging'],
    ['test', 'test'],
    ['an unset value, which is how an ops script runs', undefined],
  ])('is false for %s', async (_label, nodeEnv) => {
    const environment = await loadEnvironment(nodeEnv)

    expect(environment.isLocalDevelopment).toBe(false)
  })
})

describe('isDevelopment', () => {
  // It is the negation of production, so it is true for staging too. `logger.ts` wants that
  // meaning. Never gate a destructive side effect on it.
  test.each<[string, string | undefined, boolean]>([
    ['development', 'development', true],
    ['staging', 'staging', true],
    ['an unset value', undefined, true],
    ['production', 'production', false],
  ])('is %s for %s', async (_label, nodeEnv, expected) => {
    const environment = await loadEnvironment(nodeEnv)

    expect(environment.isDevelopment).toBe(expected)
  })
})
