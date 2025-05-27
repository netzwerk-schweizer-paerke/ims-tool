import { TaskList } from '@/payload-types'
import { stripRichTextField } from './strip-richtext'
import { PayloadRequest } from 'payload'

export const stripTaskList = async (obj: TaskList, req: PayloadRequest, organisationId: number) => {
  const { id, createdAt, createdBy, updatedAt, updatedBy, ...stripped } = obj

  // Process description rich text field if it exists
  if (stripped.description) {
    stripped.description = await stripRichTextField(stripped.description, req, organisationId)
  }

  if ('items' in stripped && stripped.items?.length) {
    stripped.items = await Promise.all(
      stripped.items.map(async (item) => {
        const { id, ...strippedItem } = item

        if (strippedItem.responsibility) {
          strippedItem.responsibility = await stripRichTextField(
            strippedItem.responsibility,
            req,
            organisationId,
          )
        }
        if (strippedItem.tools) {
          strippedItem.tools = await stripRichTextField(strippedItem.tools, req, organisationId)
        }
        if (strippedItem.topic) {
          strippedItem.topic = await stripRichTextField(strippedItem.topic, req, organisationId)
        }
        return strippedItem
      }),
    )
  }

  stripped.organisation = organisationId
  return stripped
}
