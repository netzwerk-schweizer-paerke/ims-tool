import { PayloadRequest, TypedLocale } from 'payload'

import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { TaskList } from '@/payload-types'
import { processRichTextField } from '@/payload/utilities/cloning/process-rich-text'
import { stripRowIds } from '@/payload/utilities/cloning/strip-row-ids'

/**
 * Runs once per locale, so it counts nothing. `cloneTaskFlowOrList` counts the item rows on the
 * creating pass alone, or the figure grows with the number of locales.
 */
export const stripTaskList = async (
  obj: TaskList,
  req: PayloadRequest,
  organisationId: number,
  locale: TypedLocale,
  documentPreloader: DocumentPreloader,
) => {
  const { createdAt, createdBy, id, updatedAt, updatedBy, ...strippedEntity } = obj
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

        if (strippedItem.responsibility) {
          const result = await processRichTextField(
            strippedItem.responsibility,
            req,
            organisationId,
            locationPrefix,
            locale,
            documentPreloader,
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
            documentPreloader,
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
            documentPreloader,
          )
          strippedItem.topic = result.content
        }

        return strippedItem
      }),
    )
  }

  // `files` rows keep their own primary key, which would be re-inserted verbatim.
  strippedEntity.files = stripRowIds(strippedEntity.files)

  strippedEntity.organisation = organisationId

  return strippedEntity
}
