import { PayloadRequest, TypedLocale } from 'payload'

import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { TaskFlow } from '@/payload-types'
import { processRichTextField } from '@/payload/utilities/cloning/process-rich-text'
import { stripRowIds } from '@/payload/utilities/cloning/strip-row-ids'

/**
 * Runs once per locale, so it counts nothing. `cloneTaskFlowOrList` counts the block rows on the
 * creating pass alone, or the figure grows with the number of locales.
 */
export const stripTaskFlow = async (
  obj: TaskFlow,
  req: PayloadRequest,
  organisationId: number,
  locale: TypedLocale,
  documentPreloader: DocumentPreloader,
) => {
  const { createdAt, createdBy, id, updatedAt, updatedBy, ...strippedEntity } = obj
  const locationPrefix = obj.name ? `Task Flow "${obj.name}"` : 'Task Flow'

  if (strippedEntity.description) {
    const result = await processRichTextField(
      strippedEntity.description,
      req,
      organisationId,
      locationPrefix,
      locale,
      documentPreloader,
    )
    strippedEntity.description = result.content
  }

  if ('blocks' in strippedEntity && strippedEntity.blocks?.length) {
    strippedEntity.blocks = await Promise.all(
      strippedEntity.blocks.map(async (block) => {
        const { id, ...strippedBlock } = block

        if (strippedBlock.keypoints?.keypoints) {
          const result = await processRichTextField(
            strippedBlock.keypoints.keypoints,
            req,
            organisationId,
            locationPrefix,
            locale,
            documentPreloader,
          )
          strippedBlock.keypoints.keypoints = result.content
        }

        if (strippedBlock.tools?.tools) {
          const result = await processRichTextField(
            strippedBlock.tools.tools,
            req,
            organisationId,
            locationPrefix,
            locale,
            documentPreloader,
          )
          strippedBlock.tools.tools = result.content
        }

        if (strippedBlock.responsibility?.responsibility) {
          const result = await processRichTextField(
            strippedBlock.responsibility.responsibility,
            req,
            organisationId,
            locationPrefix,
            locale,
            documentPreloader,
          )
          strippedBlock.responsibility.responsibility = result.content
        }

        return strippedBlock
      }),
    )
  }

  // `files` rows keep their own primary key, which would be re-inserted verbatim.
  strippedEntity.files = stripRowIds(strippedEntity.files)

  strippedEntity.organisation = organisationId

  return strippedEntity
}
