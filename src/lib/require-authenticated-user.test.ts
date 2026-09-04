import type { AdminViewServerProps } from 'payload'

import { redirect } from 'next/navigation'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { requireAuthenticatedUser } from '@/lib/require-authenticated-user'

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

const redirectMock = vi.mocked(redirect)

type Args = Pick<AdminViewServerProps, 'initPageResult' | 'params' | 'searchParams'>

const buildArgs = ({
  params,
  searchParams,
  user,
}: {
  params?: Args['params']
  searchParams?: Args['searchParams']
  user: unknown
}): Args =>
  ({
    initPageResult: {
      req: {
        payload: {
          config: {
            admin: { routes: { login: '/login' } },
            routes: { admin: '/admin' },
          },
        },
        user,
      },
    },
    params,
    searchParams,
  }) as unknown as Args

describe('requireAuthenticatedUser', () => {
  beforeEach(() => {
    redirectMock.mockClear()
  })

  it('lets an authenticated user through', () => {
    requireAuthenticatedUser(buildArgs({ params: { segments: ['activities'] }, user: { id: 1 } }))

    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('does not require a role, only a session', () => {
    requireAuthenticatedUser(
      buildArgs({ params: { segments: ['activities'] }, user: { id: 2, roles: [] } }),
    )

    expect(redirectMock).not.toHaveBeenCalled()
  })

  it('sends an anonymous visitor to the login page with a return path', () => {
    requireAuthenticatedUser(buildArgs({ params: { segments: ['activities'] }, user: null }))

    expect(redirectMock).toHaveBeenCalledWith('/admin/login?redirect=%2Fadmin%2Factivities')
  })

  it('keeps the search parameters in the return path', () => {
    requireAuthenticatedUser(
      buildArgs({
        params: { segments: ['flow', '12'] },
        searchParams: { locale: 'fr' },
        user: null,
      }),
    )

    expect(redirectMock).toHaveBeenCalledWith(
      '/admin/login?redirect=%2Fadmin%2Fflow%2F12%3Flocale%3Dfr',
    )
  })

  it('drops an inbound redirect key, as handleAuthRedirect does', () => {
    requireAuthenticatedUser(
      buildArgs({
        params: { segments: ['activities'] },
        searchParams: { foo: 'bar', redirect: 'zzz' },
        user: null,
      }),
    )

    expect(redirectMock).toHaveBeenCalledWith(
      '/admin/login?redirect=%2Fadmin%2Factivities%3Ffoo%3Dbar',
    )
  })

  it('falls back to the admin root when the route carries no segments', () => {
    requireAuthenticatedUser(buildArgs({ user: null }))

    expect(redirectMock).toHaveBeenCalledWith('/admin/login?redirect=%2Fadmin')
  })
})
