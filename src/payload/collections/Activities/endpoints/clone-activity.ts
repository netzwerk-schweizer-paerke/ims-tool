import { Endpoint, PayloadRequest } from 'payload'
import { getRequestData } from '@/payload/utilities/endpoints/get-request-data'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'
import { isArray } from 'lodash-es'
import {
  isActivityIOBlock,
  isActivityTaskBlock,
  isTaskFlow,
  isTaskList,
} from '@/payload/assertions'
import { Activity, ActivityIOBlock, ActivityTaskBlock, TaskFlow, TaskList } from '@/payload-types'

const stripDocument = <T>(obj: TaskFlow | TaskList | Activity) => {
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
  return stripped as T
}

const createTaskFlow = async (req: PayloadRequest, task: TaskFlow, organisationId: number) => {
  const locale = req.locale
  req.payload.logger.debug({ msg: 'creating task-flow', sourceTaskId: task.id })
  try {
    const strippedTask = stripDocument<TaskFlow>(task)
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

const createTaskList = async (req: PayloadRequest, task: TaskList, organisationId: number) => {
  const locale = req.locale
  req.payload.logger.debug({ msg: 'creating task-list', sourceTaskId: task.id })
  try {
    const strippedTask = stripDocument<TaskList>(task)
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

type SetPlacePayload = {
  params: {
    activityId: number
    organisationId: number
  }
}

export const cloneActivity: Endpoint = {
  path: '/:activityId/organisation/:organisationId',
  method: 'post',
  handler: async (req) => {
    requireAuthentication(req)
    const { params } = await getRequestData<SetPlacePayload>(req)
    const { activityId, organisationId } = params || {}
    const locale = req.locale

    if (!activityId || !organisationId) {
      return Response.json({ error: 'Missing activityId or organisationId' }, { status: 400 })
    }

    req.payload.logger.debug({ msg: 'cloning activity', activityId, organisationId, locale })

    const sourceActivity = await req.payload.findByID({
      req,
      collection: 'activities',
      id: activityId,
      locale: locale as any,
    })

    if (!sourceActivity) {
      return Response.json({ error: 'Source activity not found' }, { status: 400 })
    }

    req.payload.logger.debug({ msg: 'source activity found', sourceActivity: sourceActivity.id })

    const strippedActivity = stripDocument<Activity>(sourceActivity)

    // Clone the activity
    const clonedActivity = await req.payload.create({
      req,
      collection: 'activities',
      data: strippedActivity,
      locale: locale as any,
    })

    if (!clonedActivity) {
      return Response.json({ error: 'Failed to clone activity' }, { status: 400 })
    }

    req.payload.logger.debug({ msg: 'cloned activity created', clonedActivity: clonedActivity.id })

    if (clonedActivity.blocks) {
      const updatedBlocks: (ActivityIOBlock | ActivityTaskBlock)[] = []

      for (const block of clonedActivity.blocks) {
        const newRelations: (
          | { relationTo: 'task-flows'; value: number | TaskFlow }
          | { relationTo: 'task-lists'; value: number | TaskList }
        )[] = []

        if (
          (isActivityTaskBlock(block) || isActivityIOBlock(block)) &&
          isArray(block.relations?.tasks)
        ) {
          for (const task of block.relations.tasks) {
            const { relationTo, value } = task
            req.payload.logger.debug({ msg: 'before createHandler', relationTo })

            if (relationTo === 'task-flows' && isTaskFlow(value)) {
              try {
                req.payload.logger.debug({ msg: 'before createTaskFlow', value: value.id })
                const newTaskFlow = await createTaskFlow(req, value, organisationId)
                if (newTaskFlow) {
                  newRelations.push({ relationTo, value: newTaskFlow.id })
                }
                req.payload.logger.debug({
                  msg: 'after createTaskFlow',
                  newTaskFlow: newTaskFlow.id,
                })
              } catch (error) {
                req.payload.logger.error({ msg: 'error in createTaskFlow', error })
              }
            }

            if (relationTo === 'task-lists' && isTaskList(value)) {
              try {
                req.payload.logger.debug({ msg: 'before createTaskList', value: value.id })
                const newTaskList = await createTaskList(req, value, organisationId)
                if (newTaskList) {
                  newRelations.push({ relationTo, value: newTaskList.id })
                }
                req.payload.logger.debug({
                  msg: 'after createTaskList',
                  newTaskList: newTaskList.id,
                })
              } catch (error) {
                req.payload.logger.error({ msg: 'error in createTaskList', error })
              }
            }
          }
        }

        req.payload.logger.debug({ newRelations })

        if (newRelations.length > 0) {
          updatedBlocks.push({
            id: block.id,
            blockType: block.blockType,
            relations: { tasks: newRelations },
          })
        }
      }

      req.payload.logger.debug({ msg: 'updating cloned activity', updatedBlocks })

      if (updatedBlocks.length > 0) {
        await req.payload.update({
          req,
          collection: 'activities',
          id: clonedActivity.id,
          data: {
            blocks: updatedBlocks,
          },
        })
      }
    }

    return Response.json({ message: 'Activity cloned' }, { status: 200 })
  },
}
