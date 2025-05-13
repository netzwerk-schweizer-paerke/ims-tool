import { TaskList } from '@/payload-types'

export const stripTaskList = (obj: TaskList, organisationId: number) => {
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
  return stripped
}
