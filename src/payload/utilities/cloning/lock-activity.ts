import type { PostgresAdapter } from '@payloadcms/db-postgres'
import type { PayloadRequest } from 'payload'

import { sql } from '@payloadcms/db-postgres'

/** The first key of the lock pair. It keeps these locks apart from any other advisory lock. */
const PASTE_LOCK_NAMESPACE = 83

/** The first key of the lock on the Themen order of one park. */
const PARK_ORDER_LOCK_NAMESPACE = 84

const lockUntilCommit = async (req: PayloadRequest, namespace: number, key: number) => {
  const transactionID = await req.transactionID

  if (transactionID === undefined || transactionID === null) {
    throw new Error('A paste must run inside a transaction')
  }

  const session = (req.payload.db as unknown as PostgresAdapter).sessions[transactionID]

  if (!session) {
    throw new Error(`No database session for transaction ${String(transactionID)}`)
  }

  await session.db.execute(sql`SELECT pg_advisory_xact_lock(${namespace}, ${key})`)
}

/**
 * Serialises every paste into one Thema until the transaction ends (PIMS-83).
 *
 * A paste reads the whole block array and writes it back, so two pastes at once would lose one.
 * A `FOR UPDATE` through drizzle does not serialise, but an advisory lock does. See the vendor
 * rule `payload/cms-3`, section "drizzle session.execute() doesn't serialize FOR UPDATE locks".
 */
export const lockActivityForPaste = (req: PayloadRequest, activityId: number): Promise<void> =>
  lockUntilCommit(req, PASTE_LOCK_NAMESPACE, activityId)

/**
 * Serialises every renumber of the Themen order of one park until the transaction ends. Two
 * placements at once would each renumber from the same stale order.
 */
export const lockParkOrderForPaste = (req: PayloadRequest, organisationId: number): Promise<void> =>
  lockUntilCommit(req, PARK_ORDER_LOCK_NAMESPACE, organisationId)
