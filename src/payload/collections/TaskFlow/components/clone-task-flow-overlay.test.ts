import { describe, expect, test, vi } from 'vitest'

// The test reads constants and renders nothing. The two stubs keep the admin UI package out of
// the node run.
vi.mock('@/payload/utilities/cloning/ui/clone-overlay', () => ({ CloneOverlay: () => null }))
vi.mock('@/payload/utilities/cloning/ui/generic-clone-button', () => ({
  GenericCloneButton: () => null,
}))

import { cloneTimeoutMultiplier } from '@/payload/utilities/cloning/ui/clone-overlay-config'

import { cloneTaskFlowOverlayConfig } from './clone-task-flow-overlay'
import { drawerSlug } from './clone-task-flows-button'

describe('cloneTaskFlowOverlayConfig', () => {
  test('names the drawer that the button toggles', () => {
    expect(cloneTaskFlowOverlayConfig().drawerSlug).toBe(drawerSlug)
  })

  test('takes its timeout from the shared table', () => {
    expect(cloneTaskFlowOverlayConfig().timeoutMultiplier).toBe(
      cloneTimeoutMultiplier['task-flows'],
    )
  })
})
