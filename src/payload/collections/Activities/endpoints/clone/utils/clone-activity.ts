import { PayloadRequest, TypedLocale } from 'payload'

import { Activity } from '@/payload-types'
import { CloneHttpError } from '@/payload/utilities/cloning/clone-http-error'
import { hasLocaleContent } from '@/payload/utilities/cloning/clone-locales'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'

import type { DocumentPreloader } from '../../../../../utilities/cloning/document-preloader'

import { stripActivity } from '../../../../../utilities/cloning/strip-activity'
import { remapActivityTaskRelations } from './clone-activity-blocks'
import { cloneRelatedDocumentFiles } from './clone-related-document-files'

type ExecuteActivityCloneParams = {
  /** The copies phase 1 made, keyed by source document id. The endpoint builds it. */
  documentPreloader: DocumentPreloader
  /** Every locale the clone carries, default first. `getCloneLocales` builds the list. */
  locales: TypedLocale[]
  req: PayloadRequest
  sourceId: number
  /** The source read once per locale, with the fallback off. The endpoint reads them. */
  sourcesByLocale: Map<TypedLocale, Activity>
  targetOrgId: number
}

/**
 * Copies one activity, with a write for each locale the source really has.
 *
 * The first locale that holds content creates the record. Every later one updates it, so a
 * translation survives the clone. Each locale keeps its own blocks, which may name other tasks.
 */
export async function cloneActivity(params: ExecuteActivityCloneParams): Promise<Activity> {
  const { documentPreloader, locales, req, sourceId, sourcesByLocale, targetOrgId } = params

  const tracker = CloneStatisticsTracker.getInstance(req.transactionID)
  let created: Activity | undefined

  for (const locale of locales) {
    const source = sourcesByLocale.get(locale)

    if (!source || !hasLocaleContent(source)) {
      continue
    }

    const stripped = await stripActivity(source, req, targetOrgId, locale, documentPreloader)

    stripped.blocks = await remapActivityTaskRelations({
      blocks: stripped.blocks,
      documentPreloader,
      locales,
      req,
      targetOrgId,
    })

    if (!created) {
      for (const _block of source.blocks ?? []) {
        tracker.addSourceBlock()
        tracker.addClonedBlock()
      }

      created = await req.payload.create({
        collection: 'activities',
        data: stripped,
        depth: 0,
        locale,
        req: mergeReqContextTargetOrgId(req, targetOrgId),
      })

      await cloneRelatedDocumentFiles({
        collectionName: 'activities',
        documentPreloader,
        locale,
        req,
        sourceEntity: source,
        targetEntityId: created.id,
        targetOrgId,
      })

      req.payload.logger.debug({
        clonedActivity: created.id,
        locale,
        msg: 'Cloned activity created',
      })

      continue
    }

    // `files` rows are shared by every locale, and a write replaces the whole array. Keeping
    // the field here would drop the rows the creating locale made.
    const { files: _files, ...localeData } = stripped

    created = await req.payload.update({
      collection: 'activities',
      data: localeData,
      depth: 0,
      id: created.id,
      locale,
      req: mergeReqContextTargetOrgId(req, targetOrgId),
    })
  }

  if (!created) {
    throw new CloneHttpError(
      `Source activity ${sourceId} carries no content in ${locales.join(', ')}`,
      400,
    )
  }

  return created
}
