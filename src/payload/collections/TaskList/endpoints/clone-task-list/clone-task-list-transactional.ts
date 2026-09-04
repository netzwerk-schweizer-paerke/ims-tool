import { createTaskList } from '@/payload/utilities/cloning/clone-task-flow-or-list'
import { createCloneEndpoint } from '@/payload/utilities/cloning/create-clone-endpoint'
import { readTaskSource } from '@/payload/utilities/cloning/read-task-source'

export const cloneTaskListTransactional = createCloneEndpoint({
  cloneSource: ({ cloneLocales, documentPreloader, req, sourceId, targetOrgId, tracker }) =>
    createTaskList(req, sourceId, targetOrgId, cloneLocales, documentPreloader, tracker),
  collectionSlug: 'task-lists',
  label: { plural: 'task lists', singular: 'Task list' },
  readSource: (args) => readTaskSource('task-lists', args),
})
