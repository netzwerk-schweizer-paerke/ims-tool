'use client'
import {
  CloneOverlay,
  type CloneOverlayComponentProps,
} from '@/payload/utilities/cloning/ui/clone-overlay'
import {
  type CloneOverlayConfig,
  cloneTimeoutMultiplier,
} from '@/payload/utilities/cloning/ui/clone-overlay-config'

import { drawerSlug } from './clone-task-lists-button'

/**
 * A function, not a constant. This module and the button import each other, and a constant
 * here reads `drawerSlug` before the button assigns it when the button loads first.
 */
export const cloneTaskListOverlayConfig = (): CloneOverlayConfig<'task-lists'> => ({
  // The toggler in the button carries `clone-task-list-button`. The buttons inside the overlay
  // keep the block they carried before the overlay was shared.
  baseClass: 'clone-task-lists',
  collectionSlug: 'task-lists',
  drawerSlug,
  endpoint: '/api/task-lists/clone',
  i18nNamespace: 'cloneTaskList',
  resourceName: 'task lists',
  timeoutMultiplier: cloneTimeoutMultiplier['task-lists'],
})

export const CloneTaskListOverlay = (props: CloneOverlayComponentProps<'task-lists'>) => (
  <CloneOverlay config={cloneTaskListOverlayConfig()} {...props} />
)
