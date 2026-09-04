import { I18nKeys } from '@/lib/use-translation-custom-types'

import { CloneableCollectionSlug } from './hooks/types'

/**
 * The overlay strings that name the record type, one set per cloneable collection.
 *
 * Every other clone string reads the same whichever collection opened the overlay, so it stays
 * in `cloneActivity`. Each value is a literal, because a computed key is neither checked by the
 * compiler nor found by a search.
 */
export const cloneEntityKeys = {
  activities: {
    allFailed: 'cloneActivity:status:allFailed',
    allFailedCount: 'cloneActivity:results:allFailedCount',
    allSuccess: 'cloneActivity:status:allSuccess',
    clonedCount: 'cloneActivity:results:clonedCount',
    clonedItemId: 'cloneActivity:results:clonedActivityId',
    cloneLabel: 'cloneActivity:clone',
    entities: 'cloneActivity:form:activities',
    failedToClone: 'cloneActivity:status:failedToClone',
    instructions: 'cloneActivity:form:instructions',
    partialSuccess: 'cloneActivity:status:partialSuccess',
    processing: 'cloneActivity:processing',
    selectedCount: 'cloneActivity:form:selectedCount',
    successfullyCloned: 'cloneActivity:status:successfullyCloned',
    totalItems: 'cloneActivity:table:totalActivities',
    withIssues: 'cloneActivity:status:withIssues',
    withWarnings: 'cloneActivity:status:withWarnings',
    withWarningsDescription: 'cloneActivity:status:withWarningsDescription',
  },
  'task-flows': {
    allFailed: 'cloneTaskFlow:status:allFailed',
    allFailedCount: 'cloneTaskFlow:results:allFailedCount',
    allSuccess: 'cloneTaskFlow:status:allSuccess',
    clonedCount: 'cloneTaskFlow:results:clonedCount',
    clonedItemId: 'cloneTaskFlow:results:clonedItemId',
    cloneLabel: 'cloneTaskFlow:clone',
    entities: 'cloneTaskFlow:form:entities',
    failedToClone: 'cloneTaskFlow:status:failedToClone',
    instructions: 'cloneTaskFlow:form:instructions',
    partialSuccess: 'cloneTaskFlow:status:partialSuccess',
    processing: 'cloneTaskFlow:processing',
    selectedCount: 'cloneTaskFlow:form:selectedCount',
    successfullyCloned: 'cloneTaskFlow:status:successfullyCloned',
    totalItems: 'cloneTaskFlow:table:totalItems',
    withIssues: 'cloneTaskFlow:status:withIssues',
    withWarnings: 'cloneTaskFlow:status:withWarnings',
    withWarningsDescription: 'cloneTaskFlow:status:withWarningsDescription',
  },
  'task-lists': {
    allFailed: 'cloneTaskList:status:allFailed',
    allFailedCount: 'cloneTaskList:results:allFailedCount',
    allSuccess: 'cloneTaskList:status:allSuccess',
    clonedCount: 'cloneTaskList:results:clonedCount',
    clonedItemId: 'cloneTaskList:results:clonedItemId',
    cloneLabel: 'cloneTaskList:clone',
    entities: 'cloneTaskList:form:entities',
    failedToClone: 'cloneTaskList:status:failedToClone',
    instructions: 'cloneTaskList:form:instructions',
    partialSuccess: 'cloneTaskList:status:partialSuccess',
    processing: 'cloneTaskList:processing',
    selectedCount: 'cloneTaskList:form:selectedCount',
    successfullyCloned: 'cloneTaskList:status:successfullyCloned',
    totalItems: 'cloneTaskList:table:totalItems',
    withIssues: 'cloneTaskList:status:withIssues',
    withWarnings: 'cloneTaskList:status:withWarnings',
    withWarningsDescription: 'cloneTaskList:status:withWarningsDescription',
  },
} as const satisfies Record<CloneableCollectionSlug, Record<string, I18nKeys>>

export type CloneEntityKeys = (typeof cloneEntityKeys)[CloneableCollectionSlug]

/**
 * The key set for the collection a finished clone reports.
 *
 * The result components receive the statistics, not the collection, and every entity of one run
 * shares a collection. A run that produced no entity falls back to the activity wording.
 */
export const cloneEntityKeysFor = (collection: unknown): CloneEntityKeys =>
  collection === 'task-flows' || collection === 'task-lists'
    ? cloneEntityKeys[collection]
    : cloneEntityKeys.activities
