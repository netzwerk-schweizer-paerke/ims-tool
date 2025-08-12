import { TaskList } from '@/payload-types'
import { stripRichTextField } from './strip-richtext'
import { PayloadRequest } from 'payload'
import { CloneStatisticsTracker } from './clone-statistics-tracker'

export const stripTaskList = async (
  obj: TaskList,
  req: PayloadRequest,
  organisationId: number,
  locale?: string,
  taskListName?: string,
): Promise<any> => {
  const { id, createdAt, createdBy, updatedAt, updatedBy, ...stripped } = obj
  const tracker = CloneStatisticsTracker.getInstance()
  const locationPrefix = taskListName ? `Task List "${taskListName}"` : 'Task List'

  // Process description rich text field if it exists
  if (stripped.description) {
    const result = await stripRichTextField(stripped.description, req, organisationId, locale)
    stripped.description = result.content
    tracker.processRichTextResults(result, locationPrefix)
  }

  if ('items' in stripped && stripped.items?.length) {
    stripped.items = await Promise.all(
      stripped.items.map(async (item) => {
        const { id, ...strippedItem } = item

        if (strippedItem.responsibility) {
          const result = await stripRichTextField(
            strippedItem.responsibility,
            req,
            organisationId,
            locale,
          )
          strippedItem.responsibility = result.content
          tracker.processRichTextResults(result, locationPrefix)
        }
        if (strippedItem.tools) {
          const result = await stripRichTextField(strippedItem.tools, req, organisationId, locale)
          strippedItem.tools = result.content
          tracker.processRichTextResults(result, locationPrefix)
        }
        if (strippedItem.topic) {
          const result = await stripRichTextField(strippedItem.topic, req, organisationId, locale)
          strippedItem.topic = result.content
          tracker.processRichTextResults(result, locationPrefix)
        }
        return strippedItem
      }),
    )
  }

  stripped.organisation = organisationId

  return stripped
}
