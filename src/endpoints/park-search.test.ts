import { PayloadRequest } from 'payload'
import { describe, expect, test, vi } from 'vitest'

import { parkSearchEndpoint } from '@/endpoints/park-search'

const handler = parkSearchEndpoint.handler

const makeReq = (selectedOrganisation: unknown, find = vi.fn().mockResolvedValue({ docs: [] })) =>
  ({
    locale: 'de',
    payload: {
      config: {
        localization: { defaultLocale: 'de', locales: [{ code: 'de' }, { code: 'fr' }] },
      },
      find,
      logger: { error: vi.fn() },
    },
    user: { id: 1, selectedOrganisation },
  }) as unknown as PayloadRequest

describe('parkSearchEndpoint', () => {
  test('refuses a caller with no selected park, and reads nothing', async () => {
    const find = vi.fn()
    const response = await handler(makeReq(null, find))

    expect(response.status).toBe(400)
    expect(find).not.toHaveBeenCalled()
  })

  test('refuses when the selection is absent, which a super admin can be', async () => {
    const find = vi.fn()
    const response = await handler(makeReq(undefined, find))

    expect(response.status).toBe(400)
    expect(find).not.toHaveBeenCalled()
  })

  test('reads the four collections when a park is selected', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const response = await handler(makeReq(17, find))

    expect(response.status).toBe(200)
    expect(find).toHaveBeenCalledTimes(4)
  })

  test('accepts a populated relation, not only an id', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    const response = await handler(makeReq({ id: 17 }, find))

    expect(response.status).toBe(200)
  })

  test('never passes an organisation id, so the access rule scopes the read', async () => {
    const find = vi.fn().mockResolvedValue({ docs: [] })
    await handler(makeReq(17, find))

    for (const call of find.mock.calls) {
      expect(call[0]).toMatchObject({ overrideAccess: false })
      expect(JSON.stringify(call[0])).not.toContain('organisation')
    }
  })
})
