import { PayloadRequest } from 'payload'
import { describe, expect, it } from 'vitest'

import { User } from '@/payload-types'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'
import { resolveUploadOrganisationId } from '@/payload/utilities/resolve-upload-organisation-id'

const makeUser = (overrides: Partial<User>): User =>
  ({ collection: 'users', id: 1, roles: [], ...overrides }) as User

const makeReq = (overrides: Partial<PayloadRequest> = {}): PayloadRequest =>
  ({ context: {}, user: null, ...overrides }) as PayloadRequest

const member = (selectedOrganisation: null | number) =>
  makeReq({ user: makeUser({ selectedOrganisation }) })

describe('resolveUploadOrganisationId', () => {
  it('keeps a replaced file in the organisation that owns the stored row', () => {
    const result = resolveUploadOrganisationId({
      context: { targetOrganisationId: 7 },
      data: { organisation: 3 },
      originalDoc: { organisation: 11 },
      req: member(4),
    })

    expect(result).toBe(11)
  })

  it('prefers the target organisation the clone passes in the hook context', () => {
    const result = resolveUploadOrganisationId({
      context: { targetOrganisationId: 7 },
      data: { organisation: 3 },
      req: member(4),
    })

    expect(result).toBe(7)
  })

  it('reads the target organisation from req.context when the hook context has none', () => {
    const result = resolveUploadOrganisationId({
      data: {},
      req: makeReq({ context: { targetOrganisationId: 9 }, user: makeUser({}) }),
    })

    expect(result).toBe(9)
  })

  // The organisation field hook accepts any truthy context value, so this one must agree.
  it('accepts a numeric string on the clone context', () => {
    const result = resolveUploadOrganisationId({
      context: { targetOrganisationId: '9' },
      data: {},
      req: member(4),
    })

    expect(result).toBe(9)
  })

  // Zero is not an id, and it must never build the key `documents/0`.
  it('ignores a zero on the clone context and falls through', () => {
    const result = resolveUploadOrganisationId({
      context: { targetOrganisationId: 0 },
      data: {},
      req: member(4),
    })

    expect(result).toBe(4)
  })

  it('keeps the organisation a Local API caller passed when there is no user', () => {
    const result = resolveUploadOrganisationId({ data: { organisation: 16 }, req: makeReq() })

    expect(result).toBe(16)
  })

  // The organisation field hook returns before it reads the context when there is no user.
  it('ignores the clone context when there is no user', () => {
    const result = resolveUploadOrganisationId({
      context: { targetOrganisationId: 7 },
      data: { organisation: 16 },
      req: makeReq(),
    })

    expect(result).toBe(16)
  })

  it('returns null when there is no user and no organisation', () => {
    expect(resolveUploadOrganisationId({ data: {}, req: makeReq() })).toBeNull()
  })

  it('lets a super admin file the upload under the organisation the form names', () => {
    const result = resolveUploadOrganisationId({
      data: { organisation: 12 },
      req: makeReq({ user: makeUser({ roles: [ROLE_SUPER_ADMIN], selectedOrganisation: 4 }) }),
    })

    expect(result).toBe(12)
  })

  it('ignores an explicit organisation from a caller who is not a super admin', () => {
    const result = resolveUploadOrganisationId({ data: { organisation: 12 }, req: member(4) })

    expect(result).toBe(4)
  })

  it('reads the selected organisation from a populated relationship', () => {
    const result = resolveUploadOrganisationId({
      data: {},
      req: makeReq({ user: makeUser({ selectedOrganisation: { id: 11 } as never }) }),
    })

    expect(result).toBe(11)
  })

  it('returns null when a user has no selected organisation', () => {
    expect(resolveUploadOrganisationId({ data: {}, req: member(null) })).toBeNull()
  })
})
