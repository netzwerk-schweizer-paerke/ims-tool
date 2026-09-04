'use client'
import {
  CloneOverlay,
  type CloneOverlayComponentProps,
} from '@/payload/utilities/cloning/ui/clone-overlay'
import {
  type CloneOverlayConfig,
  cloneTimeoutMultiplier,
} from '@/payload/utilities/cloning/ui/clone-overlay-config'

import { drawerSlug } from './clone-task-flows-button'

/**
 * A function, not a constant. This module and the button import each other, and a constant
 * here reads `drawerSlug` before the button assigns it when the button loads first.
 */
export const cloneTaskFlowOverlayConfig = (): CloneOverlayConfig<'task-flows'> => ({
  // The toggler in the button carries `clone-task-flow-button`. The buttons inside the overlay
  // keep the block they carried before the overlay was shared.
  baseClass: 'clone-task-flows',
  collectionSlug: 'task-flows',
  drawerSlug,
  endpoint: '/api/task-flows/clone',
  i18nNamespace: 'cloneTaskFlow',
  resourceName: 'task flows',
  timeoutMultiplier: cloneTimeoutMultiplier['task-flows'],
})

export const CloneTaskFlowOverlay = (props: CloneOverlayComponentProps<'task-flows'>) => (
  <CloneOverlay config={cloneTaskFlowOverlayConfig()} {...props} />
)
