import { PayloadRequest, TypedLocale } from 'payload'

import { Activity } from '@/payload-types'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'

import type { DocumentPreloader } from '../../../../../utilities/cloning/document-preloader'

import { stripActivity } from '../../../../../utilities/cloning/strip-activity'
import { cloneActivityBlocks } from './clone-activity-blocks'
import { cloneRelatedDocumentFiles } from './clone-related-document-files'

type ExecuteActivityCloneParams = {
  documentPreloader?: DocumentPreloader
  locale: TypedLocale
  req: PayloadRequest
  sourceActivity: Activity
  targetOrgId: number
}

export async function cloneActivity(params: ExecuteActivityCloneParams): Promise<Activity> {
  const { documentPreloader, locale, req, sourceActivity, targetOrgId } = params

  req.payload.logger.debug({ msg: 'Source activity found', sourceActivity: sourceActivity.id })

  const strippedActivity = await stripActivity(
    sourceActivity,
    req,
    targetOrgId,
    locale,
    documentPreloader,
  )

  req.payload.logger.debug({ msg: 'Activity stripped' })

  const clonedActivity = await req.payload.create({
    collection: 'activities',
    data: strippedActivity,
    depth: 0,
    locale,
    req: mergeReqContextTargetOrgId(req, targetOrgId),
  })

  if (!clonedActivity) {
    throw new Error('Failed to clone activity')
  }

  req.payload.logger.debug({
    clonedActivity: clonedActivity.id,
    msg: 'Cloned activity created',
  })

  await cloneRelatedDocumentFiles({
    collectionName: 'activities',
    documentPreloader,
    locale,
    req,
    sourceEntity: sourceActivity,
    targetEntityId: clonedActivity.id,
    targetOrgId,
  })

  await cloneActivityBlocks({
    clonedActivity,
    documentPreloader,
    locale,
    req,
    targetOrgId,
  })

  // Fetch the updated cloned activity to get accurate statistics after block updates
  const updatedClonedActivity = await req.payload.findByID({
    collection: 'activities',
    depth: 0,
    id: clonedActivity.id,
    req,
  })

  return updatedClonedActivity
}
