import { isArray } from 'es-toolkit/compat'
import { PayloadRequest, TypedLocale } from 'payload'

import type { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { Activity } from '@/payload-types'
import { processRichTextField } from '@/payload/utilities/cloning/process-rich-text'
import { stripBlocks } from '@/payload/utilities/cloning/strip-blocks'
import { stripRowIds } from '@/payload/utilities/cloning/strip-row-ids'

export const stripActivity = async (
  obj: Activity,
  req: PayloadRequest,
  organisationId: number,
  locale: TypedLocale,
  documentPreloader: DocumentPreloader,
  tracker: CloneStatisticsTracker,
) => {
  if (!obj) {
    throw new Error('stripActivity requires an object')
  }
  if (!organisationId) {
    throw new Error('stripActivity requires an organisationId')
  }

  const { createdAt, createdBy, id, updatedAt, updatedBy, ...stripped } = obj

  if (stripped.description) {
    const result = await processRichTextField(
      stripped.description,
      req,
      organisationId,
      'activities',
      locale,
      documentPreloader,
      tracker,
    )
    stripped.description = result.content
  }

  if (obj.blocks && isArray(obj.blocks)) {
    stripped.blocks = await stripBlocks(
      obj.blocks,
      req,
      organisationId,
      locale,
      documentPreloader,
      tracker,
    )
  }

  // `files` rows keep their own primary key, which would be re-inserted verbatim.
  stripped.files = stripRowIds(stripped.files)

  stripped.organisation = organisationId

  return stripped
}
