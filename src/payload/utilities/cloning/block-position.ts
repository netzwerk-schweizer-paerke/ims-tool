/** A block row as a depth-0 read returns it. Only the fields the paste touches are typed. */
export type StoredBlock = {
  [key: string]: unknown
  blockType?: string
  id?: null | string
  relations?: null | { [key: string]: unknown; tasks?: null | StoredTaskRelation[] }
}

export type StoredTaskRelation = { relationTo: TaskCollection; value: number | { id: number } }

export type TaskCollection = 'task-flows' | 'task-lists'

/**
 * The index of a block in its activity. Each locale stores its own block array with its own ids,
 * so the id names one locale and the index names the block in all of them. See the pitfall page
 * `block-id-is-per-locale`.
 */
export const findBlockIndex = (
  blocksPerLocale: Record<string, null | readonly StoredBlock[] | undefined>,
  blockId: string,
): number => {
  for (const blocks of Object.values(blocksPerLocale)) {
    const index = blocks?.findIndex((block) => block.id === blockId) ?? -1

    if (index !== -1) {
      return index
    }
  }

  return -1
}

/**
 * Adds a task to the relations of the block at `index`, at the end or next to an anchor task.
 * It answers null when there is nothing to write: the locale has no task block there, or the
 * block already links the task. A missing anchor appends, so a locale without it still gets it.
 */
export const appendTaskRelation = (
  blocks: readonly StoredBlock[],
  index: number,
  task: { id: number; relationTo: TaskCollection },
  position?: TaskPosition,
): null | StoredBlock[] => {
  const block = blocks[index]

  // Locales can fall out of step by position. A task must then never land in an input/output
  // block that sits at this index in one locale only.
  if (block?.blockType !== 'activity-task') {
    return null
  }

  const tasks = block.relations?.tasks ?? []
  const matches = (entry: StoredTaskRelation, collection: TaskCollection, id: number) =>
    entry.relationTo === collection &&
    (typeof entry.value === 'number' ? entry.value : entry.value.id) === id

  if (tasks.some((entry) => matches(entry, task.relationTo, task.id))) {
    return null
  }

  const anchorIndex = position
    ? tasks.findIndex((entry) => matches(entry, position.anchorCollection, position.anchorId))
    : -1
  const insertAt =
    anchorIndex === -1
      ? tasks.length
      : anchorIndex + (position?.placement === 'before' ? 0 : 1)
  const added = { relationTo: task.relationTo, value: task.id }

  return blocks.map((entry, blockPosition) =>
    blockPosition === index
      ? {
          ...entry,
          relations: {
            ...entry.relations,
            tasks: [...tasks.slice(0, insertAt), added, ...tasks.slice(insertAt)],
          },
        }
      : entry,
  )
}

/** "Davor" or "Danach" one task of the same Prozessgruppe (PIMS-83). */
export type TaskPosition = {
  anchorCollection: TaskCollection
  anchorId: number
  placement: 'after' | 'before'
}
