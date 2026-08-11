/**
 * Drops the `id` of every row in a Payload array field.
 *
 * Array rows carry a primary key of their own (`activities_files.id`,
 * `task_flows_files.id`, …). Handing those ids back to `payload.create` re-inserts the
 * source row's primary key, which fails with a unique violation — and Payload's postgres
 * adapter reports it as `{ path: 'id', tableName: '<parent table>' }`, so the message the
 * caller sees ("The following field is invalid: id") names neither the array nor the row.
 *
 * Blocks and list items are stripped inline where their content is processed; this covers
 * the plain arrays that have no other processing to hang it on.
 */
export const stripRowIds = <T>(rows: null | T[] | undefined): T[] | undefined => {
  if (!Array.isArray(rows)) {
    return undefined
  }

  return rows.map((row) => {
    if (!row || typeof row !== 'object') {
      return row
    }

    const { id: _id, ...rest } = row as { id?: unknown }

    return rest as T
  })
}
