import { describe, expect, test, vi } from 'vitest'

// The test reads constants and renders nothing. The two stubs keep the admin UI package out of
// the node run.
vi.mock('@/payload/utilities/cloning/ui/clone-overlay', () => ({ CloneOverlay: () => null }))
vi.mock('@/payload/utilities/cloning/ui/generic-clone-button', () => ({
  GenericCloneButton: () => null,
}))

import { cloneTimeoutMultiplier } from '@/payload/utilities/cloning/ui/clone-overlay-config'

import { cloneTaskListOverlayConfig } from './clone-task-list-overlay'
import { drawerSlug } from './clone-task-lists-button'

describe('cloneTaskListOverlayConfig', () => {
  test('names the drawer that the button toggles', () => {
    expect(cloneTaskListOverlayConfig().drawerSlug).toBe(drawerSlug)
  })

  test('takes its timeout from the shared table', () => {
    expect(cloneTaskListOverlayConfig().timeoutMultiplier).toBe(
      cloneTimeoutMultiplier['task-lists'],
    )
  })
})
