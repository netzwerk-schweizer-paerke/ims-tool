import { PayloadRequest } from 'payload'
import { Activity } from '@/payload-types'
import { stripActivity } from '../../../../../utilities/cloning/strip-activity'
import { cloneRelatedDocumentFiles } from './clone-related-document-files'
import { cloneActivityBlocks } from './clone-activity-blocks'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'
import type { DocumentPreloader } from '../../../../../utilities/cloning/document-preloader'

type ExecuteActivityCloneParams = {
  req: PayloadRequest
  sourceActivity: Activity
  targetOrgId: number
  locale: string
  documentPreloader?: DocumentPreloader
}

export async function cloneActivity(params: ExecuteActivityCloneParams): Promise<Activity> {
  const { req, sourceActivity, targetOrgId, locale, documentPreloader } = params

  req.payload.logger.debug({ msg: 'Source activity found', sourceActivity: sourceActivity.id })

  const strippedActivity = await stripActivity(sourceActivity, req, targetOrgId, locale, documentPreloader)

  req.payload.logger.debug({ msg: 'Activity stripped' })

  const clonedActivity = await req.payload.create({
    req: mergeReqContextTargetOrgId(req, targetOrgId),
    collection: 'activities',
    data: strippedActivity,
    locale: locale as any,
    depth: 0,
  })

  if (!clonedActivity) {
    throw new Error('Failed to clone activity')
  }

  req.payload.logger.debug({
    msg: 'Cloned activity created',
    clonedActivity: clonedActivity.id,
  })

  await cloneRelatedDocumentFiles({
    req,
    sourceEntity: sourceActivity,
    targetEntityId: clonedActivity.id,
    collectionName: 'activities',
    targetOrgId,
    locale,
    documentPreloader,
  })

  await cloneActivityBlocks({
    req,
    clonedActivity,
    targetOrgId,
    locale,
    documentPreloader,
  })

  // Fetch the updated cloned activity to get accurate statistics after block updates
  const updatedClonedActivity = await req.payload.findByID({
    req,
    collection: 'activities',
    id: clonedActivity.id,
    depth: 0,
  })

  return updatedClonedActivity
}
