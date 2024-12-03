import {
  ActivityIOBlock,
  ActivityTaskBlock,
  Organisation,
  TaskFlow,
  TaskList,
} from '@/payload-types'
import { isNumber, isObject, isString } from 'lodash-es'

export const isActivityIOBlock = (block: any): block is ActivityIOBlock => {
  return (
    !isNumber(block) &&
    !isString(block) &&
    isObject(block) &&
    'blockType' in block &&
    block.blockType === 'activity-io'
  )
}

export const isActivityTaskBlock = (block: any): block is ActivityTaskBlock => {
  return (
    !isNumber(block) &&
    !isString(block) &&
    isObject(block) &&
    'blockType' in block &&
    block.blockType === 'activity-task'
  )
}

export const isTaskFlow = (task: any): task is TaskFlow => {
  return !isNumber(task) && !isString(task) && isObject(task) && 'id' in task
}

export const isTaskList = (task: any): task is TaskList => {
  return !isNumber(task) && !isString(task) && isObject(task) && 'id' in task
}

export const isOrganisation = (organisation: any): organisation is Organisation => {
  return (
    !isNumber(organisation) &&
    !isString(organisation) &&
    isObject(organisation) &&
    'id' in organisation
  )
}
