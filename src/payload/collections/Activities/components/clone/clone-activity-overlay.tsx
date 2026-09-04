'use client'
import {
  baseClass,
  drawerSlug,
} from '@/payload/collections/Activities/components/clone/clone-activity-button'
import {
  CloneOverlay,
  type CloneOverlayComponentProps,
} from '@/payload/utilities/cloning/ui/clone-overlay'
import {
  type CloneOverlayConfig,
  cloneTimeoutMultiplier,
} from '@/payload/utilities/cloning/ui/clone-overlay-config'

/**
 * A function, not a constant. This module and the button import each other, and a constant
 * here reads `drawerSlug` before the button assigns it when the button loads first.
 */
export const cloneActivityOverlayConfig = (): CloneOverlayConfig<'activities'> => ({
  // The buttons inside the overlay share the block of the toggler.
  baseClass,
  collectionSlug: 'activities',
  drawerSlug,
  endpoint: '/api/activities/clone',
  i18nNamespace: 'cloneActivity',
  resourceName: 'activities',
  timeoutMultiplier: cloneTimeoutMultiplier.activities,
})

export const CloneActivityOverlay = (props: CloneOverlayComponentProps<'activities'>) => (
  <CloneOverlay config={cloneActivityOverlayConfig()} {...props} />
)
