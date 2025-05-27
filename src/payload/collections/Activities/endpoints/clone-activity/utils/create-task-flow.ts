import { PayloadRequest } from 'payload'
import { TaskFlow } from '@/payload-types'
import { stripTaskFlow } from '@/payload/collections/Activities/endpoints/clone-activity/utils/strip-task-flow'

export const createTaskFlow = async (
  req: PayloadRequest,
  task: TaskFlow,
  organisationId: number,
) => {
  const locale = req.locale
  req.payload.logger.debug({ msg: 'createTaskFlow: creating task-flow', sourceTaskId: task.id })
  const strippedTask = await stripTaskFlow(task, req, organisationId)
  try {
    const createdTaskFlow = await req.payload.create({
      req,
      collection: 'task-flows',
      data: strippedTask,
      locale: locale as any,
    })
    req.payload.logger.debug({
      msg: 'createTaskFlow: task-flow created',
      createdTaskFlow: createdTaskFlow.id,
    })
    return createdTaskFlow
  } catch (error) {
    req.payload.logger.error({ msg: 'createTaskFlow: error creating task-flow', error })
    console.log('ERROR CREATING TASK LIST')
    console.log(JSON.stringify(task, null, 2))
    console.log('STRIPPED TASK')
    console.log(JSON.stringify(strippedTask, null, 2))
    throw error
  }
}
