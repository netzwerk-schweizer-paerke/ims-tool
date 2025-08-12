import { Activity, ActivityIOBlock, ActivityTaskBlock } from '@/payload-types'
import { compact, isArray } from 'lodash-es'
import { stripRichTextField } from './strip-richtext'
import { PayloadRequest } from 'payload'
import { CloneStatisticsTracker } from './clone-statistics-tracker'

const stripBlocks = async (
  blocks: (ActivityIOBlock | ActivityTaskBlock)[],
  req: PayloadRequest,
  organisationId: number,
  locale?: string,
): Promise<any[]> => {
  const tracker = CloneStatisticsTracker.getInstance()

  const strippedBlocks = await Promise.all(
    blocks.map(async (block, blockIndex) => {
      const { id, ...strippedBlock } = block

      // Process rich text fields in IO blocks and task blocks
      if (block.blockType === 'activity-io' || block.blockType === 'activity-task') {
        if (block.io?.input) {
          const result = await stripRichTextField(block.io.input, req, organisationId, locale)
          strippedBlock.io = {
            ...strippedBlock.io,
            input: result.content,
          }
          // Process results with location context
          tracker.processRichTextResults(
            result,
            `Block ${blockIndex + 1} (${block.blockType}) - Input field`,
          )
        }

        if (block.io?.output) {
          const result = await stripRichTextField(block.io.output, req, organisationId, locale)
          strippedBlock.io = {
            ...strippedBlock.io,
            output: result.content,
          }
          // Process results with location context
          tracker.processRichTextResults(
            result,
            `Block ${blockIndex + 1} (${block.blockType}) - Output field`,
          )
        }

        if (block.infos?.norms) {
          const result = await stripRichTextField(block.infos.norms, req, organisationId, locale)
          strippedBlock.infos = {
            ...strippedBlock.infos,
            norms: result.content,
          }
          // Process results with location context
          tracker.processRichTextResults(
            result,
            `Block ${blockIndex + 1} (${block.blockType}) - Norms field`,
          )
        }

        if (block.infos?.support) {
          const result = await stripRichTextField(block.infos.support, req, organisationId, locale)
          strippedBlock.infos = {
            ...strippedBlock.infos,
            support: result.content,
          }
          // Process results with location context
          tracker.processRichTextResults(
            result,
            `Block ${blockIndex + 1} (${block.blockType}) - Support field`,
          )
        }
      }

      return strippedBlock
    }),
  )

  return strippedBlocks
}

/**
 * Strip sensitive data from an activity for cloning
 * Uses an async approach to process document links properly
 */
export const stripActivity = async (
  obj: Activity,
  req: PayloadRequest,
  organisationId: number,
  locale?: string,
): Promise<any> => {
  if (!obj) {
    throw new Error('stripActivity requires an object')
  }
  if (!organisationId) {
    throw new Error('stripActivity requires an organisationId')
  }

  const tracker = CloneStatisticsTracker.getInstance()
  const { id, createdAt, createdBy, updatedAt, updatedBy, ...stripped } = obj

  // Process description rich text field if it exists
  if (stripped.description) {
    const result = await stripRichTextField(stripped.description, req, organisationId, locale)
    stripped.description = result.content
    // Process results with location context
    tracker.processRichTextResults(result, 'Description field')
  }

  if (obj.blocks && isArray(obj.blocks)) {
    stripped.blocks = await stripBlocks(obj.blocks, req, organisationId, locale)
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
