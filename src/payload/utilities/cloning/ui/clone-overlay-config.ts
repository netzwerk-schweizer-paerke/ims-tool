import { CloneableCollectionSlug } from './hooks/types'

/** The translation namespace of one cloneable collection. Each one carries `title` and `button`. */
export type CloneI18nNamespace = 'cloneActivity' | 'cloneTaskFlow' | 'cloneTaskList'

/**
 * Everything that differs between the clone overlays of the collections. A fourth cloneable
 * collection needs one of these and a button. The overlay itself is shared.
 */
export interface CloneOverlayConfig<
  TSlug extends CloneableCollectionSlug = CloneableCollectionSlug,
> {
  /** The BEM block of the buttons inside the overlay. It may differ from the block of the toggler. */
  baseClass: string
  collectionSlug: TSlug
  /**
   * The slug that the `DrawerToggler` of the button opens. Import it from the button file, so
   * the toggler and the drawer cannot name two different slugs.
   */
  drawerSlug: string
  endpoint: string
  i18nNamespace: CloneI18nNamespace
  /** Names the rows in the client-side error messages, such as `No task lists selected`. */
  resourceName: string
  /** Take the value from `cloneTimeoutMultiplier`. */
  timeoutMultiplier: number
}

/**
 * Milliseconds per selected item. `useCloneApi` multiplies the value by the item count.
 * An activity clone walks the blocks of the activity and clones every nested task flow and
 * task list, so it carries a larger value than a task clone.
 */
export const cloneTimeoutMultiplier = {
  activities: 300_000,
  'task-flows': 120_000,
  'task-lists': 120_000,
} as const satisfies Record<CloneableCollectionSlug, number>
