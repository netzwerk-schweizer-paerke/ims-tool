import { PayloadRequest } from 'payload'
import { TaskFlow, TaskList } from '@/payload-types'
import { stripTaskFlow } from '../../../../../utilities/cloning/strip-task-flow'
import { stripTaskList } from '../../../../../utilities/cloning/strip-task-list'
import { cloneRelatedDocumentFiles } from '@/payload/collections/Activities/endpoints/clone/utils/clone-related-document-files'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'
import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

type TaskType = 'task-flows' | 'task-lists'
type Task = TaskFlow | TaskList

interface CreateTaskOptions {
  req: PayloadRequest
  task: Task
  targetOrgId: number
  collectionName: TaskType
  locale: string
  documentPreloader?: DocumentPreloader
}

/**
 * Generic function to create task flows or task lists
 * Reduces duplication between createTaskFlow and createTaskList
 */
export const cloneTaskFlowOrList = async ({
  req,
  task,
  targetOrgId,
  collectionName,
  locale,
  documentPreloader,
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
      req: mergeReqContextTargetOrgId(req, targetOrgId),
      collection: collectionName,
      data: strippedTask,
      locale: locale as any,
    })

    req.payload.logger.debug({
      msg: `${collectionName} created successfully`,
      createdTaskId: createdTask.id,
    })

    await cloneRelatedDocumentFiles({
      req,
      sourceEntity: task,
      targetEntityId: createdTask.id,
      collectionName: collectionName,
      targetOrgId,
      locale,
      documentPreloader,
    })

    return createdTask
  } catch (error) {
    req.payload.logger.error({
      msg: `Error creating ${collectionName}`,
      error: error instanceof Error ? error.message : 'Unknown error',
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
    req,
    task,
    targetOrgId: organisationId,
    collectionName: 'task-flows',
    locale,
    documentPreloader,
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
    req,
    task,
    targetOrgId: organisationId,
    collectionName: 'task-lists',
    locale,
    documentPreloader,
  })
}
