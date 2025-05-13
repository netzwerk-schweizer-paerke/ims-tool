import { PayloadRequest } from 'payload'
import { TaskFlow } from '@/payload-types'
import { stripTaskFlow } from '@/payload/collections/Activities/endpoints/clone-activity/utils/strip-task-flow'

export const createTaskFlow = async (
  req: PayloadRequest,
  task: TaskFlow,
  organisationId: number,
) => {
  const locale = req.locale
  req.payload.logger.debug({ msg: 'creating task-flow', sourceTaskId: task.id })
  try {
    const strippedTask = stripTaskFlow(task, organisationId)
    const result = await req.payload.create({
      req,
      collection: 'task-flows',
      data: strippedTask,
      locale: locale as any,
    })
    req.payload.logger.debug({ msg: 'task-flow created', result })
    return result
  } catch (error) {
    req.payload.logger.error({ msg: 'error creating task-flow', error })
    throw error
  }
}
