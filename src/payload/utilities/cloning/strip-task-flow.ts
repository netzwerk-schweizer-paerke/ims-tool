import { TaskFlow } from '@/payload-types'
import { processRichTextField } from '@/payload/utilities/cloning/process-rich-text'
import { PayloadRequest } from 'payload'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

export const stripTaskFlow = async (
  obj: TaskFlow,
  req: PayloadRequest,
  organisationId: number,
  locale: string,
  documentPreloader?: DocumentPreloader,
): Promise<any> => {
  const { id, createdAt, createdBy, updatedAt, updatedBy, ...strippedEntity } = obj
  const tracker = CloneStatisticsTracker.getInstance(req.transactionID)
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

        tracker.addSourceBlock()

        if (strippedBlock.keypoints?.keypoints) {
          const result = await processRichTextField(
            strippedBlock.keypoints.keypoints,
            req,
            organisationId,
            locationPrefix,
            locale,
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
          )
          strippedBlock.responsibility.responsibility = result.content
        }

        tracker.addClonedBlock()

        return strippedBlock
      }),
    )
  }

  strippedEntity.organisation = organisationId

  return strippedEntity
}
