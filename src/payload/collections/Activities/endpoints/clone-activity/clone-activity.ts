import { Endpoint } from 'payload'
import { getRequestData } from '@/payload/utilities/endpoints/get-request-data'
import { requireAuthentication } from '@/payload/utilities/endpoints/require-authentication'
import { isArray, isNumber, toNumber } from 'lodash-es'
import { isActivityIOBlock, isActivityTaskBlock } from '@/payload/assertions'
import { ActivityIOBlock, ActivityTaskBlock, TaskFlow, TaskList } from '@/payload-types'
import { createTaskFlow } from '@/payload/collections/Activities/endpoints/clone-activity/utils/create-task-flow'
import { createTaskList } from '@/payload/collections/Activities/endpoints/clone-activity/utils/create-task-list'
import { stripActivity } from '@/payload/collections/Activities/endpoints/clone-activity/utils/strip-activity'
import { cloneDocument } from '@/payload/collections/Activities/endpoints/clone-activity/utils/clone-document'

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

    const orgId = toNumber(organisationId)

    if (!activityId || !orgId) {
      return Response.json({ error: 'Missing activityId or organisationId' }, { status: 400 })
    }

    req.payload.logger.debug({ msg: 'cloning activity', activityId, orgId, locale })

    // Step 1: Find the source activity
    const sourceActivity = await req.payload.findByID({
      req,
      collection: 'activities',
      id: activityId,
      locale: locale as any,
      depth: 0,
    })

    if (!sourceActivity) {
      return Response.json({ error: 'Source activity not found' }, { status: 400 })
    }

    req.payload.logger.debug({ msg: 'Source activity found', sourceActivity: sourceActivity.id })

    // Step 2: Strip activity data for initial clone
    const strippedActivity = await stripActivity(sourceActivity, req, orgId)

    req.payload.logger.debug({
      msg: 'Activity stripped',
    })

    console.log(JSON.stringify(strippedActivity, null, 2))

    // Step 3: Clone the activity (initial version without document relationships)
    const clonedActivity = await req.payload.create({
      req,
      collection: 'activities',
      data: strippedActivity,
      locale: locale as any,
      depth: 0,
    })

    if (!clonedActivity) {
      return Response.json({ error: 'Failed to clone activity' }, { status: 400 })
    }

    req.payload.logger.debug({ msg: 'Cloned activity created', clonedActivity: clonedActivity.id })

    // Step 4: Clone associated documents (if any)
    if (sourceActivity.files && isArray(sourceActivity.files)) {
      const clonedFiles = []

      for (const fileItem of sourceActivity.files) {
        if (fileItem.document) {
          try {
            const documentId =
              typeof fileItem.document === 'object' ? fileItem.document.id : fileItem.document
            const clonedDoc = await cloneDocument(req, documentId, orgId)

            if (clonedDoc) {
              clonedFiles.push({
                document: clonedDoc.id,
              })
            }
          } catch (error) {
            req.payload.logger.error({
              msg: 'Error cloning document',
              error,
              fileItem,
            })
          }
        }
      }

      // Update activity with cloned documents
      if (clonedFiles.length > 0) {
        await req.payload.update({
          req,
          collection: 'activities',
          id: clonedActivity.id,
          data: {
            files: clonedFiles,
          },
        })

        req.payload.logger.debug({
          msg: 'Updated activity with cloned documents',
          count: clonedFiles.length,
        })
      }
    }

    // Step 5: Process the blocks and clone related tasks
    if (clonedActivity.blocks) {
      const updatedBlocks: (ActivityIOBlock | ActivityTaskBlock)[] = []

      for (const block of clonedActivity.blocks) {
        console.log('block', block.id)
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
            console.log('task', task.value)

            req.payload.logger.debug({ msg: 'before createHandler', relationTo })

            console.log({
              relationTo,
              value,
            })

            if (relationTo === 'task-flows' && isNumber(value)) {
              // get the task flow
              const taskFlow = await req.payload.findByID({
                req,
                collection: 'task-flows',
                id: value,
                locale: locale as any,
                depth: 0,
              })
              try {
                req.payload.logger.debug({ msg: 'before createTaskFlow', value: taskFlow.id })
                const newTaskFlow = await createTaskFlow(req, taskFlow, orgId)
                if (newTaskFlow) {
                  newRelations.push({ relationTo, value: newTaskFlow.id })
                }
                req.payload.logger.debug({
                  msg: 'after createTaskFlow',
                  newTaskFlow: newTaskFlow.id,
                })
              } catch (error: any) {
                req.payload.logger.error({ msg: 'error in createTaskFlow', error })
                throw new Error(`Failed to clone task flow: ${error.message || 'Unknown error'}`)
              }
            }

            if (relationTo === 'task-lists' && isNumber(value)) {
              // get the task list
              const taskList = await req.payload.findByID({
                req,
                collection: 'task-lists',
                id: value,
                locale: locale as any,
                depth: 0,
              })
              try {
                req.payload.logger.debug({ msg: 'before createTaskList', value: taskList.id })
                const newTaskList = await createTaskList(req, taskList, orgId)
                if (newTaskList) {
                  newRelations.push({ relationTo, value: newTaskList.id })
                }
                req.payload.logger.debug({
                  msg: 'after createTaskList',
                  newTaskList: newTaskList.id,
                })
              } catch (error: any) {
                req.payload.logger.error({ msg: 'error in createTaskList', error })
                throw new Error(`Failed to clone task list: ${error.message || 'Unknown error'}`)
              }
            }
          }
        }

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
