import { TaskFlow } from '@/payload-types'
import { stripRichTextField } from './strip-richtext'
import { PayloadRequest } from 'payload'
import { CloneStatisticsTracker } from './clone-statistics-tracker'

export const stripTaskFlow = async (
  obj: TaskFlow,
  req: PayloadRequest,
  organisationId: number,
  locale?: string,
  taskFlowName?: string,
): Promise<any> => {
  const { id, createdAt, createdBy, updatedAt, updatedBy, ...stripped } = obj
  const tracker = CloneStatisticsTracker.getInstance()
  const locationPrefix = taskFlowName ? `Task Flow "${taskFlowName}"` : 'Task Flow'

  // Process description rich text field if it exists
  if (stripped.description) {
    const result = await stripRichTextField(stripped.description, req, organisationId, locale)
    stripped.description = result.content
    tracker.processRichTextResults(result, locationPrefix)
  }

  if ('blocks' in stripped && stripped.blocks?.length) {
    stripped.blocks = await Promise.all(
      stripped.blocks.map(async (block) => {
        const { id, ...strippedBlock } = block

        // Process any rich text fields in blocks
        if (strippedBlock.keypoints?.keypoints) {
          const result = await stripRichTextField(
            strippedBlock.keypoints.keypoints,
            req,
            organisationId,
            locale,
          )
          strippedBlock.keypoints.keypoints = result.content
          tracker.processRichTextResults(result, locationPrefix)
        }

        if (strippedBlock.tools?.tools) {
          const result = await stripRichTextField(
            strippedBlock.tools.tools,
            req,
            organisationId,
            locale,
          )
          strippedBlock.tools.tools = result.content
          tracker.processRichTextResults(result, locationPrefix)
        }

        if (strippedBlock.responsibility?.responsibility) {
          const result = await stripRichTextField(
            strippedBlock.responsibility.responsibility,
            req,
            organisationId,
            locale,
          )
          strippedBlock.responsibility.responsibility = result.content
          tracker.processRichTextResults(result, locationPrefix)
        }

        return strippedBlock
      }),
    )
  }

  stripped.organisation = organisationId

  return stripped
}
