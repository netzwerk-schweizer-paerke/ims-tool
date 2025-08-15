import { TaskList } from '@/payload-types'
import { processRichTextField } from '@/payload/utilities/cloning/process-rich-text'
import { PayloadRequest } from 'payload'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

export const stripTaskList = async (
  obj: TaskList,
  req: PayloadRequest,
  organisationId: number,
  locale: string,
  documentPreloader?: DocumentPreloader,
): Promise<any> => {
  const { id, createdAt, createdBy, updatedAt, updatedBy, ...strippedEntity } = obj
  const tracker = CloneStatisticsTracker.getInstance(req.transactionID)
  const locationPrefix = obj.name ? `Task List "${obj.name}"` : 'Task List'

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

  if ('items' in strippedEntity && strippedEntity.items?.length) {
    strippedEntity.items = await Promise.all(
      strippedEntity.items.map(async (item) => {
        const { id, ...strippedItem } = item

        tracker.addSourceBlock()

        if (strippedItem.responsibility) {
          const result = await processRichTextField(
            strippedItem.responsibility,
            req,
            organisationId,
            locationPrefix,
            locale,
          )
          strippedItem.responsibility = result.content
        }
        if (strippedItem.tools) {
          const result = await processRichTextField(
            strippedItem.tools,
            req,
            organisationId,
            locationPrefix,
            locale,
          )
          strippedItem.tools = result.content
        }
        if (strippedItem.topic) {
          const result = await processRichTextField(
            strippedItem.topic,
            req,
            organisationId,
            locationPrefix,
            locale,
          )
          strippedItem.topic = result.content
        }

        tracker.addClonedBlock()

        return strippedItem
      }),
    )
  }

  strippedEntity.organisation = organisationId

  return strippedEntity
}
