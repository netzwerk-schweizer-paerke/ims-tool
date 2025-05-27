import { TaskFlow } from '@/payload-types'
import { stripRichTextField } from './strip-richtext'
import { PayloadRequest } from 'payload'

export const stripTaskFlow = async (obj: TaskFlow, req: PayloadRequest, organisationId: number) => {
  const { id, createdAt, createdBy, updatedAt, updatedBy, ...stripped } = obj

  // Process description rich text field if it exists
  if (stripped.description) {
    stripped.description = await stripRichTextField(stripped.description, req, organisationId)
  }

  if ('blocks' in stripped && stripped.blocks?.length) {
    stripped.blocks = await Promise.all(
      stripped.blocks.map(async (block) => {
        const { id, ...strippedBlock } = block

        // Process any rich text fields in blocks
        if (strippedBlock.keypoints?.keypoints) {
          strippedBlock.keypoints.keypoints = await stripRichTextField(
            strippedBlock.keypoints.keypoints,
            req,
            organisationId,
          )
        }

        if (strippedBlock.tools?.tools) {
          strippedBlock.tools.tools = await stripRichTextField(
            strippedBlock.tools.tools,
            req,
            organisationId,
          )
        }

        if (strippedBlock.responsibility?.responsibility) {
          strippedBlock.responsibility.responsibility = await stripRichTextField(
            strippedBlock.responsibility.responsibility,
            req,
            organisationId,
          )
        }

        return strippedBlock
      }),
    )
  }

  stripped.organisation = organisationId
  return stripped
}
