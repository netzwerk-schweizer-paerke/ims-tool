import { ActivityIOBlock, ActivityTaskBlock } from '@/payload-types'
import { PayloadRequest } from 'payload'
import { processRichTextField } from '@/payload/utilities/cloning/process-rich-text'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

export const stripBlocks = async (
  blocks: (ActivityIOBlock | ActivityTaskBlock)[],
  req: PayloadRequest,
  organisationId: number,
  locale: string,
  documentPreloader?: DocumentPreloader,
): Promise<any[]> => {
  const strippedBlocks = await Promise.all(
    blocks.map(async (block, blockIndex) => {
      const { id, ...strippedBlock } = block
      if (block.blockType === 'activity-io' || block.blockType === 'activity-task') {
        if (block.io?.input) {
          const result = await processRichTextField(
            block.io.input,
            req,
            organisationId,
            'activities',
            locale,
            documentPreloader,
          )
          strippedBlock.io = {
            ...strippedBlock.io,
            input: result.content,
          }
        }

        if (block.io?.output) {
          const result = await processRichTextField(
            block.io.output,
            req,
            organisationId,
            'activities',
            locale,
            documentPreloader,
          )
          strippedBlock.io = {
            ...strippedBlock.io,
            output: result.content,
          }
        }

        if (block.infos?.norms) {
          const result = await processRichTextField(
            block.infos.norms,
            req,
            organisationId,
            'activities',
            locale,
            documentPreloader,
          )
          strippedBlock.infos = {
            ...strippedBlock.infos,
            norms: result.content,
          }
        }

        if (block.infos?.support) {
          const result = await processRichTextField(
            block.infos.support,
            req,
            organisationId,
            'activities',
            locale,
            documentPreloader,
          )
          strippedBlock.infos = {
            ...strippedBlock.infos,
            support: result.content,
          }
        }
      }

      return strippedBlock
    }),
  )

  return strippedBlocks
}
