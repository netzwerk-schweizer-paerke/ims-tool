import { isNumber, isObject, isString } from 'es-toolkit/compat'

import {
  ActivityIOBlock,
  ActivityTaskBlock,
  Organisation,
  TaskFlow,
  TaskList,
} from '@/payload-types'

// `isObject` narrows to `object`, and TypeScript permits no property read on that type.
// A walker over an arbitrary Payload document needs this predicate to read a key.
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// `Array.isArray` narrows an `unknown` to `any[]`, which leaks `any` into every element.
export const isUnknownArray = (value: unknown): value is unknown[] => Array.isArray(value)

export const isActivityIOBlock = (block: unknown): block is ActivityIOBlock => {
  return (
    !isNumber(block) &&
    !isString(block) &&
    isObject(block) &&
    'blockType' in block &&
    block.blockType === 'activity-io'
  )
}

export const isActivityTaskBlock = (block: unknown): block is ActivityTaskBlock => {
  return (
    !isNumber(block) &&
    !isString(block) &&
    isObject(block) &&
    'blockType' in block &&
    block.blockType === 'activity-task'
  )
}

export const isTaskFlow = (task: unknown): task is TaskFlow => {
  return !isNumber(task) && !isString(task) && isObject(task) && 'id' in task
}

export const isTaskList = (task: unknown): task is TaskList => {
  return !isNumber(task) && !isString(task) && isObject(task) && 'id' in task
}

export const isOrganisation = (organisation: unknown): organisation is Organisation => {
  return (
    !isNumber(organisation) &&
    !isString(organisation) &&
    isObject(organisation) &&
    'id' in organisation
  )
}
