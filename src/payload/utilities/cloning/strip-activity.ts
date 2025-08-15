import { Activity } from '@/payload-types'
import { isArray } from 'es-toolkit/compat'
import { processRichTextField } from '@/payload/utilities/cloning/process-rich-text'
import { PayloadRequest } from 'payload'
import { stripBlocks } from '@/payload/utilities/cloning/strip-blocks'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

export const stripActivity = async (
  obj: Activity,
  req: PayloadRequest,
  organisationId: number,
  locale: string,
  documentPreloader?: DocumentPreloader,
): Promise<any> => {
  if (!obj) {
    throw new Error('stripActivity requires an object')
  }
  if (!organisationId) {
    throw new Error('stripActivity requires an organisationId')
  }

  const { id, createdAt, createdBy, updatedAt, updatedBy, ...stripped } = obj

  if (stripped.description) {
    const result = await processRichTextField(
      stripped.description,
      req,
      organisationId,
      'activities',
      locale,
      documentPreloader,
    )
    stripped.description = result.content
  }

  if (obj.blocks && isArray(obj.blocks)) {
    stripped.blocks = await stripBlocks(obj.blocks, req, organisationId, locale, documentPreloader)
  }

  stripped.organisation = organisationId

  return stripped
}
