import type { AdminViewServerProps } from 'payload'

import { redirect } from 'next/navigation'
import { formatAdminURL } from 'payload/shared'

type RequireAuthenticatedUserArgs = Pick<
  AdminViewServerProps,
  'initPageResult' | 'params' | 'searchParams'
>

/**
 * Payload skips its own login redirect for every view under `admin.components.views`, because
 * `isCustomAdminView` matches on the path alone and reads no flag. A custom view must therefore
 * send an unauthenticated visitor to the login page itself.
 *
 * This tests the user, never `permissions.canAccessAdmin`. That permission resolves to
 * `access.admin` when the auth collection declares one, which would narrow these views to admins.
 */
export const requireAuthenticatedUser = ({
  initPageResult,
  params,
  searchParams,
}: RequireAuthenticatedUserArgs): void => {
  if (initPageResult.req.user) {
    return
  }

  const { config } = initPageResult.req.payload
  const adminRoute = config.routes.admin

  const segments = Array.isArray(params?.segments) ? params.segments : []
  const path: `/${string}` | null = segments.length > 0 ? `/${segments.join('/')}` : null

  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    // Payload's own `handleAuthRedirect` deletes an inbound `redirect` key. Match it, so a
    // second bounce does not carry a stale target into the return path.
    if (key === 'redirect') {
      continue
    }
    if (typeof value === 'string') {
      query.append(key, value)
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        query.append(key, entry)
      }
    }
  }

  const currentRoute = formatAdminURL({ adminRoute, path })
  const queryString = query.toString()
  const loginRoute = formatAdminURL({ adminRoute, path: config.admin.routes.login })
  const loginQuery = new URLSearchParams({
    redirect: queryString ? `${currentRoute}?${queryString}` : currentRoute,
  })

  redirect(`${loginRoute}?${loginQuery.toString()}`)
}
