import { PayloadRequest } from 'payload'
import { TaskList } from '@/payload-types'
import { stripTaskList } from '@/payload/collections/Activities/endpoints/clone-activity/utils/strip-task-list'

export const createTaskList = async (
  req: PayloadRequest,
  task: TaskList,
  organisationId: number,
) => {
  const locale = req.locale
  req.payload.logger.debug({ msg: 'creating task-list', sourceTaskId: task.id })
  try {
    const strippedTask = stripTaskList(task, organisationId)
    const result = await req.payload.create({
      req,
      collection: 'task-lists',
      data: strippedTask,
      locale: locale as any,
    })
    req.payload.logger.debug({ msg: 'task-list created', result })
    return result
  } catch (error) {
    req.payload.logger.error({ msg: 'error creating task-list', error })
    throw error
  }
}
