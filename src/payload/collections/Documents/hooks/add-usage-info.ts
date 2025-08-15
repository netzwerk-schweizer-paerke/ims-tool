import { CollectionAfterReadHook } from 'payload'
import { getLocaleCodesFromRequest, getLocalizedValue } from '@/lib/locale-utils'
import { isArray, isObject } from 'es-toolkit/compat'

/**
 * Get the name from a potentially localized field
 * When locale: 'all' is used, localized fields are returned as objects
 */
function getName(nameField: any, locales: string[]): string {
  return getLocalizedValue(nameField, locales)
}

/**
 * Get the description from a potentially localized field
 */
function getDescription(descField: any, locales: string[]): any {
  if (!descField) return null

  // If it's already a rich text object, return it
  if (descField.root) {
    return descField
  }

  // If it's a localized object, check each locale
  if (typeof descField === 'object') {
    for (const locale of locales) {
      if (descField[locale]) {
        return descField[locale]
      }
    }
  }

  return null
}

/**
 * Recursively check any value for document references
 * Handles both rich text fields and nested structures
 */
function checkForDocumentReference(value: any, documentId: number): boolean {
  if (!value) return false

  // If it's a rich text field
  if (value.root) {
    return isDocumentReferencedInRichText(value, documentId)
  }

  // If it's an array, check each item
  if (isArray(value)) {
    return value.some((item) => checkForDocumentReference(item, documentId))
  }

  // If it's an object, check all properties
  if (typeof value === 'object') {
    return Object.values(value).some((val) => checkForDocumentReference(val, documentId))
  }

  return false
}

/**
 * Check if a document ID is referenced in a rich text field
 * Searches for link nodes with document references (Lexical editor format)
 */
function isDocumentReferencedInRichText(richText: any, documentId: number): boolean {
  if (!richText || !richText.root) return false

  // Recursively search through the rich text structure
  function searchNode(node: any): boolean {
    if (!node) return false

    // Check if this is a link node with a document reference (Lexical format)
    if (
      node.type === 'link' &&
      node.fields?.doc?.relationTo === 'documents' &&
      node.fields?.doc?.value?.id === documentId
    ) {
      return true
    }

    // Check if this is a relationship node pointing to our document (older format)
    if (node.type === 'relationship' || node.type === 'upload') {
      if (node.relationTo === 'documents' && node.value?.id === documentId) {
        return true
      }
      // Also check if value is directly the ID (some formats store it differently)
      if (node.relationTo === 'documents' && node.value === documentId) {
        return true
      }
    }

    // Check children nodes
    if (node.children && isArray(node.children)) {
      for (const child of node.children) {
        if (searchNode(child)) return true
      }
    }

    // Check any other properties that might contain nodes
    for (const key in node) {
      if (key !== 'children' && typeof node[key] === 'object') {
        if (searchNode(node[key])) return true
      }
    }

    return false
  }

  return searchNode(richText.root)
}

/**
 * Hook to add usage information to documents
 * Shows where this document is referenced in activities, task flows, and task lists
 * Checks both direct file references and rich text field references
 */
export const addUsageInfoAfterReadHook: CollectionAfterReadHook = async ({
  doc,
  req,
  findMany,
}) => {
  // Get configured locales from Payload config
  const locales = getLocaleCodesFromRequest(req)
  // Skip if this is a findMany operation (list view) for performance
  if (findMany || !doc) {
    return doc
  }

  try {
    const usedIn = {
      activities: [] as Array<{
        id: number
        name: string
        referenceType: string
        field?: string // Which field contains the reference
        locale?: string // Which locale (if applicable)
        path?: string // Full path to the reference
        blockId?: string // Block ID if in a block
        blockType?: string // Type of block
      }>,
      taskFlows: [] as Array<{
        id: number
        name: string
        referenceType: string
        field?: string
        locale?: string
        path?: string
        blockId?: string
        blockType?: string
      }>,
      taskLists: [] as Array<{
        id: number
        name: string
        referenceType: string
        field?: string
        locale?: string
        path?: string
        itemIndex?: number // For TaskList items
      }>,
    }

    // Search for references in Activities
    // First, find activities with direct file references
    const activitiesWithFiles = await req.payload.find({
      collection: 'activities',
      where: {
        'files.document': {
          equals: doc.id,
        },
      },
      depth: 0,
      limit: 100,
      locale: 'all', // Include all locales
      req,
    })

    for (const activity of activitiesWithFiles.docs) {
      const activityName = getName(activity.name, locales)
      usedIn.activities.push({
        id: activity.id,
        name: activityName || `Activity ${activity.id}`,
        referenceType: 'file',
        field: 'files',
        path: 'files.document',
      })
    }

    // Then search all activities for rich text references
    // This is more expensive but necessary for complete usage tracking
    // Need depth=2 to get nested block content and relations
    const allActivities = await req.payload.find({
      collection: 'activities',
      depth: 2, // Need depth 2 for nested content in blocks
      limit: 1000,
      locale: 'all', // Include all locales
      req,
    })

    for (const activity of allActivities.docs) {
      // Skip if already found via file reference
      if (usedIn.activities.some((a) => a.id === activity.id)) continue

      // Check description field (handle localized descriptions)
      let foundInDescription = false
      const description = getDescription(activity.description, locales)
      if (description && isDocumentReferencedInRichText(description, doc.id)) {
        const activityName = getName(activity.name, locales)
        usedIn.activities.push({
          id: activity.id,
          name: activityName || `Activity ${activity.id}`,
          referenceType: 'richtext',
          field: 'description',
          path: 'description',
        })
        foundInDescription = true
      }

      // Also check all localized versions if description is an object
      if (
        !foundInDescription &&
        typeof activity.description === 'object' &&
        activity.description !== null &&
        !activity.description.root
      ) {
        // Use locales from config
        for (const locale of locales) {
          if (
            activity.description[locale] &&
            isDocumentReferencedInRichText(activity.description[locale], doc.id)
          ) {
            const activityName = getName(activity.name, locales)
            usedIn.activities.push({
              id: activity.id,
              name: activityName || `Activity ${activity.id}`,
              referenceType: 'richtext',
              field: 'description',
              locale: locale,
              path: `description.${locale}`,
            })
            foundInDescription = true
            break
          }
        }
      }

      if (foundInDescription) continue

      // Check blocks for rich text fields (handle localized blocks)
      // Blocks can be either an array or a localized object with locale keys
      let foundInBlocks = false

      if (activity.blocks) {
        // Enhanced block checking with detailed location tracking
        const checkBlocksWithDetails = (
          blocks: any,
          locale?: string,
        ): { found: boolean; details?: any } => {
          if (!blocks || !isArray(blocks)) return { found: false }

          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i]

            // Check all fields in the block recursively
            if (checkForDocumentReference(block, doc.id)) {
              // Try to get more specific location
              let fieldPath = ''
              let blockInfo: any = {
                blockType: block.blockType,
                blockId: block.id,
              }

              // Check specific fields based on block type
              if (block.blockType === 'activity-io') {
                if (block.io && checkForDocumentReference(block.io, doc.id)) {
                  fieldPath = locale ? `blocks.${locale}[${i}].io` : `blocks[${i}].io`
                  blockInfo.field = 'io'
                } else if (block.infos && checkForDocumentReference(block.infos, doc.id)) {
                  fieldPath = locale ? `blocks.${locale}[${i}].infos` : `blocks[${i}].infos`
                  blockInfo.field = 'infos'
                }
              } else if (block.blockType === 'activity-task' && block.relations?.tasks) {
                for (let j = 0; j < block.relations.tasks.length; j++) {
                  const task = block.relations.tasks[j]
                  if (checkForDocumentReference(task, doc.id)) {
                    fieldPath = locale
                      ? `blocks.${locale}[${i}].relations.tasks[${j}]`
                      : `blocks[${i}].relations.tasks[${j}]`
                    blockInfo.field = 'relations.tasks'
                    blockInfo.taskIndex = j
                    break
                  }
                }
              }

              return {
                found: true,
                details: {
                  ...blockInfo,
                  path: fieldPath || (locale ? `blocks.${locale}[${i}]` : `blocks[${i}]`),
                  locale: locale,
                  blockIndex: i,
                },
              }
            }
          }
          return { found: false }
        }

        // Check blocks - might be localized
        let blockDetails: any = null
        if (typeof activity.blocks === 'object' && !isArray(activity.blocks)) {
          // Localized blocks - check all locales
          // Use locales from config
          for (const locale of locales) {
            if (activity.blocks[locale]) {
              const result = checkBlocksWithDetails(activity.blocks[locale], locale)
              if (result.found) {
                foundInBlocks = true
                blockDetails = result.details
                break
              }
            }
          }
        } else {
          // Non-localized blocks
          const result = checkBlocksWithDetails(activity.blocks)
          if (result.found) {
            foundInBlocks = true
            blockDetails = result.details
          }
        }

        if (foundInBlocks) {
          const activityName = getName(activity.name, locales)
          usedIn.activities.push({
            id: activity.id,
            name: activityName || `Activity ${activity.id}`,
            referenceType: 'richtext-block',
            field: blockDetails?.field || 'blocks',
            locale: blockDetails?.locale,
            path: blockDetails?.path,
            blockId: blockDetails?.blockId,
            blockType: blockDetails?.blockType,
          })
        }
      }
    }

    // Search for references in TaskFlows
    const taskFlows = await req.payload.find({
      collection: 'task-flows',
      where: {
        'files.document': {
          equals: doc.id,
        },
      },
      depth: 0,
      limit: 100,
      locale: 'all', // Include all locales
      req,
    })

    for (const taskFlow of taskFlows.docs) {
      const taskFlowName = getName(taskFlow.name, locales)
      usedIn.taskFlows.push({
        id: taskFlow.id,
        name: taskFlowName || `TaskFlow ${taskFlow.id}`,
        referenceType: 'file',
        field: 'files',
        path: 'files.document',
      })
    }

    // Search TaskFlows for rich text references
    const allTaskFlows = await req.payload.find({
      collection: 'task-flows',
      depth: 2, // Need depth 2 for nested content
      limit: 1000,
      locale: 'all', // Include all locales
      req,
    })

    for (const taskFlow of allTaskFlows.docs) {
      // Skip if already found via file reference
      if (usedIn.taskFlows.some((tf) => tf.id === taskFlow.id)) continue

      let foundInTaskFlow = false

      // Check description field (handle localized descriptions)
      const description = getDescription(taskFlow.description, locales)
      if (description && isDocumentReferencedInRichText(description, doc.id)) {
        foundInTaskFlow = true
      }

      // Also check all localized versions if description is an object
      if (
        !foundInTaskFlow &&
        typeof taskFlow.description === 'object' &&
        taskFlow.description !== null &&
        !taskFlow.description.root
      ) {
        // Use locales from config
        for (const locale of locales) {
          if (
            taskFlow.description[locale] &&
            isDocumentReferencedInRichText(taskFlow.description[locale], doc.id)
          ) {
            foundInTaskFlow = true
            break
          }
        }
      }

      // Check blocks for TaskFlows with detailed location
      let blockLocale: string | undefined
      let blockPath = 'blocks'
      let blockDetails: any = null

      if (!foundInTaskFlow && taskFlow.blocks) {
        // Helper to find block with document reference and get details
        const findBlockWithDoc = (blocks: any[], locale?: string): any => {
          if (!isArray(blocks)) return null
          for (let i = 0; i < blocks.length; i++) {
            const block = blocks[i]
            if (checkForDocumentReference(block, doc.id)) {
              return {
                blockType: block.blockType,
                blockId: block.id,
                blockIndex: i,
                path: locale ? `blocks.${locale}[${i}]` : `blocks[${i}]`,
                locale,
              }
            }
          }
          return null
        }

        if (typeof taskFlow.blocks === 'object' && !isArray(taskFlow.blocks)) {
          // Localized blocks
          // Use locales from config
          for (const locale of locales) {
            if (taskFlow.blocks[locale]) {
              blockDetails = findBlockWithDoc(taskFlow.blocks[locale], locale)
              if (blockDetails) {
                foundInTaskFlow = true
                blockLocale = locale
                blockPath = blockDetails.path
                break
              }
            }
          }
        } else if (isArray(taskFlow.blocks)) {
          blockDetails = findBlockWithDoc(taskFlow.blocks)
          if (blockDetails) {
            foundInTaskFlow = true
            blockPath = blockDetails.path
          }
        }
      }

      if (foundInTaskFlow) {
        const taskFlowName = getName(taskFlow.name, locales)
        const referenceDetails: any = {
          id: taskFlow.id,
          name: taskFlowName || `TaskFlow ${taskFlow.id}`,
          referenceType: 'richtext',
        }

        // Add specific field details based on where it was found
        if (taskFlow.description && checkForDocumentReference(taskFlow.description, doc.id)) {
          referenceDetails.field = 'description'
          referenceDetails.path = taskFlow.description.root
            ? 'description'
            : `description.${blockLocale || 'unknown'}`
          if (blockLocale) referenceDetails.locale = blockLocale
        } else if (taskFlow.blocks) {
          referenceDetails.field = 'blocks'
          referenceDetails.path = blockPath || 'blocks'
          if (blockLocale || blockDetails?.locale)
            referenceDetails.locale = blockLocale || blockDetails.locale
          if (blockDetails?.blockId) referenceDetails.blockId = blockDetails.blockId
          if (blockDetails?.blockType) referenceDetails.blockType = blockDetails.blockType
        }

        usedIn.taskFlows.push(referenceDetails)
      }
    }

    // Search for references in TaskLists
    const taskLists = await req.payload.find({
      collection: 'task-lists',
      where: {
        'files.document': {
          equals: doc.id,
        },
      },
      depth: 0,
      limit: 100,
      locale: 'all', // Include all locales
      req,
    })

    for (const taskList of taskLists.docs) {
      const taskListName = getName(taskList.name, locales)
      usedIn.taskLists.push({
        id: taskList.id,
        name: taskListName || `TaskList ${taskList.id}`,
        referenceType: 'file',
        field: 'files',
        path: 'files.document',
      })
    }

    // Search TaskLists for rich text references
    const allTaskLists = await req.payload.find({
      collection: 'task-lists',
      depth: 2, // Need depth 2 for nested content
      limit: 1000,
      locale: 'all', // Include all locales
      req,
    })

    for (const taskList of allTaskLists.docs) {
      // Skip if already found via file reference
      if (usedIn.taskLists.some((tl) => tl.id === taskList.id)) continue

      let foundInTaskList = false

      // Check description field (handle localized descriptions)
      const description = getDescription(taskList.description, locales)
      if (description && isDocumentReferencedInRichText(description, doc.id)) {
        foundInTaskList = true
      }

      // Also check all localized versions if description is an object
      if (
        !foundInTaskList &&
        typeof taskList.description === 'object' &&
        taskList.description !== null &&
        !taskList.description.root
      ) {
        // Use locales from config
        for (const locale of locales) {
          if (
            taskList.description[locale] &&
            isDocumentReferencedInRichText(taskList.description[locale], doc.id)
          ) {
            foundInTaskList = true
            break
          }
        }
      }

      // Check items for TaskLists with detailed location
      let itemLocale: string | undefined
      let itemPath = 'items'
      let itemIndex: number | undefined

      if (!foundInTaskList && taskList.items) {
        if (typeof taskList.items === 'object' && !isArray(taskList.items)) {
          // Localized items
          // Use locales from config
          for (const locale of locales) {
            if (taskList.items[locale] && isArray(taskList.items[locale])) {
              const items = taskList.items[locale] as any[]
              for (let i = 0; i < items.length; i++) {
                if (checkForDocumentReference(items[i], doc.id)) {
                  foundInTaskList = true
                  itemLocale = locale
                  itemIndex = i
                  itemPath = `items.${locale}[${i}]`
                  break
                }
              }
              if (foundInTaskList) break
            }
          }
        } else if (isArray(taskList.items)) {
          for (let i = 0; i < taskList.items.length; i++) {
            if (checkForDocumentReference(taskList.items[i], doc.id)) {
              foundInTaskList = true
              itemIndex = i
              itemPath = `items[${i}]`
              break
            }
          }
        }
      }

      if (foundInTaskList) {
        const taskListName = getName(taskList.name, locales)
        const referenceDetails: any = {
          id: taskList.id,
          name: taskListName || `TaskList ${taskList.id}`,
          referenceType: 'richtext',
        }

        // Add specific field details
        if (taskList.description && checkForDocumentReference(taskList.description, doc.id)) {
          referenceDetails.field = 'description'
          referenceDetails.path = 'description'
        } else if (taskList.items) {
          referenceDetails.field = 'items'
          referenceDetails.path = itemPath
          if (itemLocale) referenceDetails.locale = itemLocale
          if (itemIndex !== undefined) referenceDetails.itemIndex = itemIndex
        }

        usedIn.taskLists.push(referenceDetails)
      }
    }

    // Add usage information to the document
    return {
      ...doc,
      usedIn,
      usageCount: usedIn.activities.length + usedIn.taskFlows.length + usedIn.taskLists.length,
    }
  } catch (error) {
    // If there's an error, just return the document without usage info
    console.error('[Document Usage Hook] Error:', error)
    return doc
  }
}
