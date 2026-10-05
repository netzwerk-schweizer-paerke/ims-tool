import { CollectionAfterLoginHook } from 'payload'

import { User } from '@/payload-types'

/**
 * Stamps `lastLoginAt`, which the statistics count as activity per park (PIMS-93).
 *
 * The hook runs inside the login transaction, which also holds the new session. A failed
 * `payload.update` rolls that transaction back, and the user is logged out at once. The adapter
 * call writes one column and runs no validation and no hook, so it has no such failure path.
 */
export const recordLastLoginAfterLoginHook: CollectionAfterLoginHook<User> = async ({
  req,
  user,
}) => {
  await req.payload.db.updateOne({
    collection: 'users',
    data: { lastLoginAt: new Date().toISOString() },
    id: user.id,
    req,
    returning: false,
  })

  return user
}
