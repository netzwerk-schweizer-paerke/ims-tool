import type { Payload } from 'payload'

import type { AdminStatsReport, ParkStatsRow, TechnicalStats } from '@/lib/admin-stats/types'

import {
  countByOrganisation,
  countNamedPerLocale,
  type OrganisationTally,
  tallyUsers,
} from '@/lib/admin-stats/tally-rows'
import { getLocaleCodes } from '@/lib/locale-utils'
import { ROLE_SUPER_ADMIN } from '@/payload/utilities/constants'

/**
 * Read the whole instance and build the statistics report.
 *
 * Every query passes `overrideAccess: true`. `currentOrganisationCollectionReadAccess` filters
 * by the caller's selected park, super admins included, so an access-checked sweep reports zero
 * for every other park and reads as a healthy result. The endpoint carries the role gate instead.
 */
export const collectAdminStats = async (payload: Payload): Promise<AdminStatsReport> => {
  const locales = getLocaleCodes(payload.config)

  const [
    organisations,
    activities,
    taskFlows,
    taskLists,
    documents,
    media,
    documentsPublic,
    users,
    shareLinks,
  ] = await Promise.all([
    findAll(payload, 'organisations', { name: true, organisationLanguage: true }),
    findLocalisedContent(payload, 'activities'),
    findLocalisedContent(payload, 'task-flows'),
    findLocalisedContent(payload, 'task-lists'),
    findAll(payload, 'documents', { filesize: true, organisation: true }),
    findAll(payload, 'media', { filesize: true, organisation: true }),
    findAll(payload, 'documents-public', { filesize: true }),
    findAll(payload, 'users', { organisations: true, roles: true }),
    countOnly(payload, 'share-links'),
  ])

  const activityTally = countByOrganisation(activities)
  const flowTally = countByOrganisation(taskFlows)
  const listTally = countByOrganisation(taskLists)
  const documentTally = countByOrganisation(documents)
  const mediaTally = countByOrganisation(media)
  const userTally = tallyUsers(users, ROLE_SUPER_ADMIN)

  const parks: ParkStatsRow[] = organisations.map((organisation) => {
    const id = readNumber(organisation.id)
    const documentBytes = read(documentTally, id)
    const mediaBytes = read(mediaTally, id)

    return {
      activities: read(activityTally, id).count,
      documents: documentBytes.count,
      id,
      language: readText(organisation.organisationLanguage),
      media: mediaBytes.count,
      name: readText(organisation.name),
      storageBytes: documentBytes.bytes + mediaBytes.bytes,
      taskFlows: read(flowTally, id).count,
      taskLists: read(listTally, id).count,
      users: userTally.byPark.get(id) ?? 0,
    }
  })

  const publicBytes = countByOrganisation(documentsPublic).unassigned
  const contentTotal = activities.length + taskFlows.length + taskLists.length
  const namedPerLocale = mergeNameCounts(
    [activities, taskFlows, taskLists].map((rows) => countNamedPerLocale(rows, locales)),
    locales,
  )

  return {
    content: {
      documentsPublic: documentsPublic.length,
      perLocale: locales.map((locale) => ({
        locale,
        named: namedPerLocale.get(locale) ?? 0,
        total: contentTotal,
      })),
      shareLinks,
      totals: {
        activities: activities.length,
        documents: documents.length,
        media: media.length,
        'task-flows': taskFlows.length,
        'task-lists': taskLists.length,
      },
    },
    parks,
    storage: {
      byCollection: [
        { bytes: sumBytes(documentTally), collection: 'documents', files: documents.length },
        { bytes: sumBytes(mediaTally), collection: 'media', files: media.length },
        {
          bytes: publicBytes.bytes,
          collection: 'documents-public',
          files: documentsPublic.length,
        },
      ],
      totalBytes: sumBytes(documentTally) + sumBytes(mediaTally) + publicBytes.bytes,
    },
    technical: collectTechnicalStats(payload),
    timestamp: new Date().toISOString(),
    users: {
      noPark: userTally.noPark,
      superAdmins: userTally.superAdmins,
      total: userTally.total,
    },
  }
}

const collectTechnicalStats = (payload: Payload): TechnicalStats => ({
  adminLanguages: Object.keys(payload.config.i18n.supportedLanguages ?? {}),
  contentLocales: getLocaleCodes(payload.config),
  environment: process.env.NODE_ENV ?? 'unknown',
  nodeVersion: process.version,
  s3Bucket: process.env.S3_BUCKET ?? '',
  s3Endpoint: process.env.S3_ENDPOINT ?? '',
})

const countOnly = async (payload: Payload, collection: 'share-links'): Promise<number> => {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 1,
    overrideAccess: true,
  })

  return result.totalDocs
}

/** `limit: 0` returns every row. An omitted limit is 10, not "unlimited". */
const findAll = async <
  TSlug extends 'documents' | 'documents-public' | 'media' | 'organisations' | 'users',
>(
  payload: Payload,
  collection: TSlug,
  select: Record<string, true>,
) => {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 0,
    overrideAccess: true,
    select,
  })

  return result.docs
}

/**
 * `locale: 'all'` returns a localized field as a record keyed by locale code, which is what the
 * translation coverage counts. The non-localized `organisation` comes back unchanged.
 */
const findLocalisedContent = async <TSlug extends 'activities' | 'task-flows' | 'task-lists'>(
  payload: Payload,
  collection: TSlug,
) => {
  const result = await payload.find({
    collection,
    depth: 0,
    limit: 0,
    locale: 'all',
    overrideAccess: true,
    select: { name: true, organisation: true },
  })

  return result.docs
}

const mergeNameCounts = (
  counts: readonly Map<string, number>[],
  locales: readonly string[],
): Map<string, number> => {
  const merged = new Map<string, number>(locales.map((locale) => [locale, 0]))

  for (const count of counts) {
    for (const locale of locales) {
      merged.set(locale, (merged.get(locale) ?? 0) + (count.get(locale) ?? 0))
    }
  }

  return merged
}

const read = (tally: OrganisationTally, id: number) =>
  tally.byPark.get(id) ?? { bytes: 0, count: 0 }

const readNumber = (value: unknown): number => (typeof value === 'number' ? value : 0)

const readText = (value: unknown): string => (typeof value === 'string' ? value : '')

const sumBytes = (tally: OrganisationTally): number => {
  let total = tally.unassigned.bytes

  for (const entry of tally.byPark.values()) {
    total += entry.bytes
  }

  return total
}
