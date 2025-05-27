import { PayloadRequest } from 'payload'
import { TaskList } from '@/payload-types'
import { stripTaskList } from '@/payload/collections/Activities/endpoints/clone-activity/utils/strip-task-list'

export const createTaskList = async (
  req: PayloadRequest,
  task: TaskList,
  organisationId: number,
) => {
  const locale = req.locale
  req.payload.logger.debug({ msg: 'createTaskList: creating task-list', sourceTaskId: task.id })
  const strippedTask = await stripTaskList(task, req, organisationId)
  console.log('STRIPPED TASK')
  console.log({ strippedTask })
  try {
    const createdTaskList = await req.payload.create({
      req,
      collection: 'task-lists',
      data: strippedTask,
      locale: locale as any,
    })
    req.payload.logger.debug({
      msg: 'createTaskList: task-list created',
      createdTaskList: createdTaskList.id,
    })
    return createdTaskList
  } catch (error) {
    req.payload.logger.error({ msg: 'createTaskList: error creating task-list', error })
    console.log('ERROR CREATING TASK LIST')
    console.log(JSON.stringify(task, null, 2))
    console.log('STRIPPED TASK')
    console.log(JSON.stringify(strippedTask, null, 2))
    throw error
  }
}
