import { Activity, TaskFlow, TaskList } from '@/payload-types'
import { PayloadRequest } from 'payload'

export const strippedEntry = <T>(obj: TaskFlow | TaskList | Activity, organisationId: number) => {
  const { id, createdAt, createdBy, updatedAt, updatedBy, ...stripped } = obj
  if ('blocks' in stripped) {
    // @ts-ignore
    stripped.blocks = stripped.blocks.map((block) => {
      const { id, ...strippedBlock } = block
      return strippedBlock
    })
  }
  if ('items' in stripped) {
    // @ts-ignore
    stripped.items = stripped.items.map((item) => {
      const { id, ...strippedItem } = item
      return strippedItem
    })
  }
  stripped.organisation = organisationId
  return stripped as T
}

export const createTaskFlow = async (
  req: PayloadRequest,
  task: TaskFlow,
  organisationId: number,
) => {
  const locale = req.locale
  req.payload.logger.debug({ msg: 'creating task-flow', sourceTaskId: task.id })
  try {
    const strippedTask = strippedEntry<TaskFlow>(task, organisationId)
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

export const createTaskList = async (
  req: PayloadRequest,
  task: TaskList,
  organisationId: number,
) => {
  const locale = req.locale
  req.payload.logger.debug({ msg: 'creating task-list', sourceTaskId: task.id })
  try {
    const strippedTask = strippedEntry<TaskList>(task, organisationId)
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
