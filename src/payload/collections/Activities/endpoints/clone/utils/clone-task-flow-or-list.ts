import { PayloadRequest } from 'payload'

import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { TaskFlow, TaskList } from '@/payload-types'
import { cloneRelatedDocumentFiles } from '@/payload/collections/Activities/endpoints/clone/utils/clone-related-document-files'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'

import { stripTaskFlow } from '../../../../../utilities/cloning/strip-task-flow'
import { stripTaskList } from '../../../../../utilities/cloning/strip-task-list'

interface CreateTaskOptions {
  collectionName: TaskType
  documentPreloader?: DocumentPreloader
  locale: string
  req: PayloadRequest
  targetOrgId: number
  task: Task
}
type Task = TaskFlow | TaskList

type TaskType = 'task-flows' | 'task-lists'

/**
 * Generic function to create task flows or task lists
 * Reduces duplication between createTaskFlow and createTaskList
 */
export const cloneTaskFlowOrList = async ({
  collectionName,
  documentPreloader,
  locale,
  req,
  targetOrgId,
  task,
}: CreateTaskOptions) => {
  req.payload.logger.debug({
    msg: `Creating ${collectionName}`,
    sourceTaskId: task.id,
  })

  const strippedTask =
    collectionName === 'task-flows'
      ? await stripTaskFlow(task as TaskFlow, req, targetOrgId, locale, documentPreloader)
      : await stripTaskList(task as TaskList, req, targetOrgId, locale, documentPreloader)

  try {
    const createdTask = await req.payload.create({
      collection: collectionName,
      data: strippedTask,
      locale: locale as any,
      req: mergeReqContextTargetOrgId(req, targetOrgId),
    })

    req.payload.logger.debug({
      createdTaskId: createdTask.id,
      msg: `${collectionName} created successfully`,
    })

    await cloneRelatedDocumentFiles({
      collectionName: collectionName,
      documentPreloader,
      locale,
      req,
      sourceEntity: task,
      targetEntityId: createdTask.id,
      targetOrgId,
    })

    return createdTask
  } catch (error) {
    req.payload.logger.error({
      error: error instanceof Error ? error.message : 'Unknown error',
      msg: `Error creating ${collectionName}`,
      sourceTaskId: task.id,
    })
    throw error
  }
}

/**
 * Convenience function for creating task flows
 */
export const createTaskFlow = async (
  req: PayloadRequest,
  task: TaskFlow,
  organisationId: number,
  locale: string,
  documentPreloader?: DocumentPreloader,
) => {
  return cloneTaskFlowOrList({
    collectionName: 'task-flows',
    documentPreloader,
    locale,
    req,
    targetOrgId: organisationId,
    task,
  })
}

/**
 * Convenience function for creating task lists
 */
export const createTaskList = async (
  req: PayloadRequest,
  task: TaskList,
  organisationId: number,
  locale: string,
  documentPreloader?: DocumentPreloader,
) => {
  return cloneTaskFlowOrList({
    collectionName: 'task-lists',
    documentPreloader,
    locale,
    req,
    targetOrgId: organisationId,
    task,
  })
}
