import { createTaskFlow } from '@/payload/utilities/cloning/clone-task-flow-or-list'
import { createCloneEndpoint } from '@/payload/utilities/cloning/create-clone-endpoint'
import { readTaskSource } from '@/payload/utilities/cloning/read-task-source'

export const cloneTaskFlowTransactional = createCloneEndpoint({
  cloneSource: ({ cloneLocales, documentPreloader, req, sourceId, targetOrgId, tracker }) =>
    createTaskFlow(req, sourceId, targetOrgId, cloneLocales, documentPreloader, tracker),
  collectionSlug: 'task-flows',
  label: { plural: 'task flows', singular: 'Task flow' },
  readSource: (args) => readTaskSource('task-flows', args),
})
