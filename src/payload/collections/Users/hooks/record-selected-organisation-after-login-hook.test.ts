import { describe, expect, test, vi } from 'vitest'

import { User } from '@/payload-types'
import { recordSelectedOrganisationAfterLoginHook } from '@/payload/collections/Users/hooks/record-selected-organisation-after-login-hook'

/**
 * The secrets an afterLogin hook still sees. Payload strips them in the field-level afterRead,
 * which runs after every afterLogin hook.
 */
const SECRETS = ['hash', 'salt', 'resetPasswordToken', 'resetPasswordExpiration'] as const

const makeUser = (overrides: Partial<User> = {}): User =>
  ({
    email: 'someone@example.org',
    hash: 'pbkdf2$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    id: 42,
    organisations: [],
    resetPasswordExpiration: '2026-09-04T00:00:00.000Z',
    resetPasswordToken: 'a-live-reset-token',
    roles: [],
    salt: 'bbbbbbbbbbbbbbbb',
    ...overrides,
  }) as unknown as User

const makeReq = () => {
  const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
  const update = vi.fn()
  return { logger, req: { payload: { logger, update } }, update }
}

/** Every value handed to any logger method, flattened to one JSON string. */
const loggedText = (logger: ReturnType<typeof makeReq>['logger']) =>
  JSON.stringify([...logger.info.mock.calls, ...logger.warn.mock.calls, ...logger.error.mock.calls])

describe('recordSelectedOrganisationAfterLoginHook', () => {
  test('logs the user id alone when the user belongs to no organisation', async () => {
    const { logger, req, update } = makeReq()
    const user = makeUser()

    await recordSelectedOrganisationAfterLoginHook({ req, user } as any)

    expect(logger.warn).toHaveBeenCalledWith({ userId: 42 }, 'No organisations found for the user')
    expect(update).not.toHaveBeenCalled()
  })

  test('never writes a password hash or a reset token to the log', async () => {
    const { logger, req } = makeReq()

    await recordSelectedOrganisationAfterLoginHook({ req, user: makeUser() } as any)

    const text = loggedText(logger)
    for (const secret of SECRETS) {
      expect(text).not.toContain(secret)
    }
    expect(text).not.toContain('pbkdf2$aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
    expect(text).not.toContain('a-live-reset-token')
  })

  test('keeps the secrets out of the log when a stored organisation is no longer assigned', async () => {
    const { logger, req } = makeReq()
    const user = makeUser({
      organisations: [{ organisation: 7, roles: ['user'] }],
      selectedOrganisation: 99,
    } as Partial<User>)

    await recordSelectedOrganisationAfterLoginHook({ req, user } as any)

    expect(logger.warn).toHaveBeenCalledWith(
      { selectedOrganisation: 99, userId: 42 },
      'Stored organisation is not assigned to the user, resetting it',
    )
    expect(loggedText(logger)).not.toContain('a-live-reset-token')
  })
})
