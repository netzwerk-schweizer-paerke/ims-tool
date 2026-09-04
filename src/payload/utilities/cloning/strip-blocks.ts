import { PayloadRequest, TypedLocale } from 'payload'

import type { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { ActivityIOBlock, ActivityTaskBlock } from '@/payload-types'
import { processRichTextField } from '@/payload/utilities/cloning/process-rich-text'

export const stripBlocks = async (
  blocks: (ActivityIOBlock | ActivityTaskBlock)[],
  req: PayloadRequest,
  organisationId: number,
  locale: TypedLocale,
  documentPreloader: DocumentPreloader,
  tracker: CloneStatisticsTracker,
) => {
  const strippedBlocks = await Promise.all(
    blocks.map(async (block) => {
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
            tracker,
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
            tracker,
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
            tracker,
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
            tracker,
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
