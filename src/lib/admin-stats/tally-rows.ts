import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

export type LocalisedName = Record<string, unknown>

export type OrganisationScopedRow = {
  filesize?: null | number
  organisation?: unknown
}

export type OrganisationTally = {
  byPark: Map<number, RowTally>
  unassigned: RowTally
}

export type RowTally = {
  bytes: number
  count: number
}

export type UserRow = {
  organisations?: null | { organisation?: unknown }[]
  roles?: null | string[]
}

export type UserTally = {
  byPark: Map<number, number>
  noPark: number
  superAdmins: number
  total: number
}

/**
 * Count rows per organisation, and sum `filesize` where the collection is an upload.
 *
 * A row with no organisation lands in `unassigned`. It is a real state: `documents-public`
 * carries no organisation, and a row can lose one.
 */
export const countByOrganisation = (
  rows: readonly OrganisationScopedRow[],
): OrganisationTally => {
  const byPark = new Map<number, RowTally>()
  const unassigned: RowTally = { bytes: 0, count: 0 }

  for (const row of rows) {
    const target = getIdFromRelation(row.organisation)
    const tally = target === null ? unassigned : (byPark.get(target) ?? { bytes: 0, count: 0 })

    tally.bytes += toByteCount(row.filesize)
    tally.count += 1

    if (target !== null) {
      byPark.set(target, tally)
    }
  }

  return { byPark, unassigned }
}

/**
 * Count, per locale, how many records carry a name in that locale.
 *
 * A read with `locale: 'all'` returns a localized field as a record keyed by locale code.
 * Any other shape counts for no locale, because it proves nothing about coverage.
 */
export const countNamedPerLocale = (
  rows: readonly { name?: unknown }[],
  locales: readonly string[],
): Map<string, number> => {
  const named = new Map<string, number>(locales.map((locale) => [locale, 0]))

  for (const row of rows) {
    if (!isLocalisedName(row.name)) {
      continue
    }

    for (const locale of locales) {
      if (hasText(row.name[locale])) {
        named.set(locale, (named.get(locale) ?? 0) + 1)
      }
    }
  }

  return named
}

/**
 * Count users overall, per role and per organisation.
 *
 * A user can belong to several parks, so the per-park counts sum to more than the total.
 */
export const tallyUsers = (rows: readonly UserRow[], superAdminRole: string): UserTally => {
  const byPark = new Map<number, number>()
  let noPark = 0
  let superAdmins = 0

  for (const row of rows) {
    if (Array.isArray(row.roles) && row.roles.includes(superAdminRole)) {
      superAdmins += 1
    }

    const memberships = Array.isArray(row.organisations) ? row.organisations : []
    const parks = new Set(
      memberships
        .map((entry) => getIdFromRelation(entry?.organisation))
        .filter((id): id is number => id !== null),
    )

    if (parks.size === 0) {
      noPark += 1
      continue
    }

    for (const park of parks) {
      byPark.set(park, (byPark.get(park) ?? 0) + 1)
    }
  }

  return { byPark, noPark, superAdmins, total: rows.length }
}

const hasText = (value: unknown): boolean => typeof value === 'string' && value.trim().length > 0

const isLocalisedName = (value: unknown): value is LocalisedName =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const toByteCount = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0
