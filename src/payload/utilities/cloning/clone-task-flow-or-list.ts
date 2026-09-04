import { PayloadRequest, TypedLocale } from 'payload'

import type { DocumentPreloader } from '@/payload/utilities/cloning/document-preloader'

import { TaskFlow, TaskList } from '@/payload-types'
import { CloneHttpError, getValidationDetails } from '@/payload/utilities/cloning/clone-http-error'
import { hasLocaleContent } from '@/payload/utilities/cloning/clone-locales'
import { cloneRelatedDocumentFiles } from '@/payload/utilities/cloning/clone-related-document-files'
import { CloneStatisticsTracker } from '@/payload/utilities/cloning/clone-statistics-tracker'
import { getErrorMessage } from '@/payload/utilities/cloning/error-utils'
import { mergeReqContextTargetOrgId } from '@/payload/utilities/cloning/merge-req-context-target-org-id'
import { stripTaskFlow } from '@/payload/utilities/cloning/strip-task-flow'
import { stripTaskList } from '@/payload/utilities/cloning/strip-task-list'

interface CreateTaskOptions {
  collectionName: TaskType
  /** The copies phase 1 made, keyed by source document id. The endpoint builds it. */
  documentPreloader: DocumentPreloader
  /** Every locale the clone carries, default first. `getCloneLocales` builds the list. */
  locales: TypedLocale[]
  req: PayloadRequest
  sourceId: number
  targetOrgId: number
  /** The statistics of the entity the endpoint started. Every counter below lands on it. */
  tracker: CloneStatisticsTracker
}
type Task = TaskFlow | TaskList

type TaskType = 'task-flows' | 'task-lists'

/**
 * Copies one task flow or task list, with a read and a write for each locale it carries.
 *
 * The first locale that holds content creates the record. Every later one updates it in place,
 * so a translation survives the clone instead of becoming a second copy of the German text.
 */
export const cloneTaskFlowOrList = async ({
  collectionName,
  documentPreloader,
  locales,
  req,
  sourceId,
  targetOrgId,
  tracker,
}: CreateTaskOptions) => {
  let created: Task | undefined

  req.payload.logger.debug({
    locales,
    msg: `Creating ${collectionName}`,
    sourceTaskId: sourceId,
  })

  for (const locale of locales) {
    // `false` is the only value that turns the fallback off. `null` turns it on.
    // See .claude/rules/project/pitfalls/fallback-locale-null-enables-the-fallback.md
    const source = (await req.payload.findByID({
      collection: collectionName,
      depth: 0,
      fallbackLocale: false,
      id: sourceId,
      locale,
      req,
    })) as Task

    if (!hasLocaleContent(source)) {
      continue
    }

    const isTaskFlow = collectionName === 'task-flows'

    const stripped = isTaskFlow
      ? await stripTaskFlow(
          source as TaskFlow,
          req,
          targetOrgId,
          locale,
          documentPreloader,
          tracker,
        )
      : await stripTaskList(
          source as TaskList,
          req,
          targetOrgId,
          locale,
          documentPreloader,
          tracker,
        )

    try {
      if (!created) {
        const rows = isTaskFlow ? (source as TaskFlow).blocks : (source as TaskList).items
        countRows(tracker, rows?.length ?? 0)

        created = await req.payload.create({
          collection: collectionName,
          data: stripped,
          locale,
          req: mergeReqContextTargetOrgId(req, targetOrgId),
        })

        await cloneRelatedDocumentFiles({
          collectionName,
          documentPreloader,
          locale,
          req,
          sourceEntity: source,
          targetEntityId: created.id,
          targetOrgId,
          tracker,
        })

        continue
      }

      // `files` rows are shared by every locale, and a write replaces the whole array. Keeping
      // the field here would drop the rows the creating locale made.
      const { files: _files, ...localeData } = stripped

      created = await req.payload.update({
        collection: collectionName,
        data: localeData,
        id: created.id,
        locale,
        req: mergeReqContextTargetOrgId(req, targetOrgId),
      })
    } catch (error) {
      req.payload.logger.error({
        details: getValidationDetails(error),
        error: getErrorMessage(error),
        locale,
        msg: `Error creating ${collectionName}`,
        sourceTaskId: sourceId,
      })
      throw error
    }
  }

  if (!created) {
    throw new CloneHttpError(
      `Source ${collectionName} ${sourceId} carries no content in ${locales.join(', ')}`,
      400,
    )
  }

  req.payload.logger.debug({
    createdTaskId: created.id,
    msg: `${collectionName} created successfully`,
  })

  return created
}

/**
 * Convenience function for creating task flows
 */
export const createTaskFlow = async (
  req: PayloadRequest,
  sourceId: number,
  organisationId: number,
  locales: TypedLocale[],
  documentPreloader: DocumentPreloader,
  tracker: CloneStatisticsTracker,
) => {
  return cloneTaskFlowOrList({
    collectionName: 'task-flows',
    documentPreloader,
    locales,
    req,
    sourceId,
    targetOrgId: organisationId,
    tracker,
  })
}

/**
 * Convenience function for creating task lists
 */
export const createTaskList = async (
  req: PayloadRequest,
  sourceId: number,
  organisationId: number,
  locales: TypedLocale[],
  documentPreloader: DocumentPreloader,
  tracker: CloneStatisticsTracker,
) => {
  return cloneTaskFlowOrList({
    collectionName: 'task-lists',
    documentPreloader,
    locales,
    req,
    sourceId,
    targetOrgId: organisationId,
    tracker,
  })
}

/**
 * Counts the rows of the creating locale only. A count per locale pass would report three times
 * the rows the record shows, which is the misleading figure the result panel used to carry.
 */
const countRows = (tracker: CloneStatisticsTracker, rowCount: number): void => {
  for (let index = 0; index < rowCount; index++) {
    tracker.addSourceBlock()
    tracker.addClonedBlock()
  }
}
