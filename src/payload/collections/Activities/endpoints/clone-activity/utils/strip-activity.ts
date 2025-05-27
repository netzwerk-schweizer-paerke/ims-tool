import { Activity, ActivityIOBlock, ActivityTaskBlock } from '@/payload-types'
import { compact, isArray } from 'lodash-es'
import { stripRichTextField } from './strip-richtext'
import { PayloadRequest } from 'payload'

const stripBlocks = async (
  blocks: (ActivityIOBlock | ActivityTaskBlock)[],
  req: PayloadRequest,
  organisationId: number,
) => {
  return Promise.all(
    blocks.map(async (block) => {
      const { id, ...strippedBlock } = block

      // Process rich text fields in IO blocks
      if (block.blockType === 'activity-io') {
        if (block.io?.input) {
          strippedBlock.io = {
            ...strippedBlock.io,
            input: await stripRichTextField(block.io.input, req, organisationId),
          }
        }

        if (block.io?.output) {
          strippedBlock.io = {
            ...strippedBlock.io,
            output: await stripRichTextField(block.io.output, req, organisationId),
          }
        }

        if (block.infos?.norms) {
          strippedBlock.infos = {
            ...strippedBlock.infos,
            norms: await stripRichTextField(block.infos.norms, req, organisationId),
          }
        }

        if (block.infos?.support) {
          strippedBlock.infos = {
            ...strippedBlock.infos,
            support: await stripRichTextField(block.infos.support, req, organisationId),
          }
        }
      }

      return strippedBlock
    }),
  )
}

/**
 * Strip sensitive data from an activity for cloning
 * Uses an async approach to process document links properly
 */
export const stripActivity = async (obj: Activity, req: PayloadRequest, organisationId: number) => {
  if (!obj) {
    throw new Error('stripActivity requires an object')
  }
  if (!organisationId) {
    throw new Error('stripActivity requires an organisationId')
  }

  const { id, createdAt, createdBy, updatedAt, updatedBy, ...stripped } = obj

  // Process description rich text field if it exists
  if (stripped.description) {
    stripped.description = await stripRichTextField(stripped.description, req, organisationId)
  }

  if (obj.blocks && isArray(obj.blocks)) {
    stripped.blocks = await stripBlocks(obj.blocks, req, organisationId)
  }

  if (obj.files && isArray(obj.files)) {
    stripped.files = compact(
      stripped.files?.map((file) => {
        const { id, ...strippedFile } = file
        return strippedFile
      }),
    )
  }

  // Set the organisation ID
  stripped.organisation = organisationId

  return stripped
}
