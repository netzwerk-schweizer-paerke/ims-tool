import { describe, expect, test, vi } from 'vitest'

// The test reads constants and renders nothing. The two stubs keep the admin UI package out of
// the node run.
vi.mock('@/payload/utilities/cloning/ui/clone-overlay', () => ({ CloneOverlay: () => null }))
vi.mock('@/payload/utilities/cloning/ui/generic-clone-button', () => ({
  GenericCloneButton: () => null,
}))

import { cloneTimeoutMultiplier } from '@/payload/utilities/cloning/ui/clone-overlay-config'

import { baseClass, drawerSlug } from './clone-activity-button'
import { cloneActivityOverlayConfig } from './clone-activity-overlay'

describe('cloneActivityOverlayConfig', () => {
  test('names the drawer that the button toggles', () => {
    expect(cloneActivityOverlayConfig().drawerSlug).toBe(drawerSlug)
  })

  test('shares the block of the toggler', () => {
    expect(cloneActivityOverlayConfig().baseClass).toBe(baseClass)
  })

  test('takes its timeout from the shared table', () => {
    expect(cloneActivityOverlayConfig().timeoutMultiplier).toBe(cloneTimeoutMultiplier.activities)
  })
})
