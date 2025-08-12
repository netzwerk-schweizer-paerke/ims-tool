import { PayloadRequest } from 'payload'
import { TaskFlow, TaskList } from '@/payload-types'
import { stripTaskFlow } from './strip-task-flow'
import { stripTaskList } from './strip-task-list'
import { CloneStatisticsTracker } from './clone-statistics-tracker'

type TaskType = 'task-flows' | 'task-lists'
type Task = TaskFlow | TaskList

interface CreateTaskOptions {
  req: PayloadRequest
  task: Task
  organisationId: number
  collectionType: TaskType
  locale?: string
}

/**
 * Generic function to create task flows or task lists
 * Reduces duplication between createTaskFlow and createTaskList
 */
export const createTask = async ({
  req,
  task,
  organisationId,
  collectionType,
  locale: passedLocale,
}: CreateTaskOptions) => {
  const locale = passedLocale || req.locale
  const tracker = CloneStatisticsTracker.getInstance()

  req.payload.logger.debug({
    msg: `Creating ${collectionType}`,
    sourceTaskId: task.id,
  })

  // Strip task based on type
  const strippedTask =
    collectionType === 'task-flows'
      ? await stripTaskFlow(task as TaskFlow, req, organisationId, locale as string, task.name)
      : await stripTaskList(task as TaskList, req, organisationId, locale as string, task.name)

  try {
    const createdTask = await req.payload.create({
      req,
      collection: collectionType,
      data: strippedTask,
      locale: locale as any,
    })

    req.payload.logger.debug({
      msg: `${collectionType} created successfully`,
      createdTaskId: createdTask.id,
    })

    // Update statistics
    if (collectionType === 'task-flows') {
      tracker.incrementTaskFlowsCloned()
    } else {
      tracker.incrementTaskListsCloned()
    }

    return createdTask
  } catch (error) {
    req.payload.logger.error({
      msg: `Error creating ${collectionType}`,
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
  locale?: string,
) => {
  return createTask({
    req,
    task,
    organisationId,
    collectionType: 'task-flows',
    locale,
  })
}

/**
 * Convenience function for creating task lists
 */
export const createTaskList = async (
  req: PayloadRequest,
  task: TaskList,
  organisationId: number,
  locale?: string,
) => {
  return createTask({
    req,
    task,
    organisationId,
    collectionType: 'task-lists',
    locale,
  })
}
