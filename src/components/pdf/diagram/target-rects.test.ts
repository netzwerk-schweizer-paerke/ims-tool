import { describe, expect, test } from 'vitest'

import { OuterTargetsEnum } from '@/components/graph/fields/graph/lib/outer-targets'

import { outerTargetRect, targetRect } from './target-rects'

const BLOCK = { height: 40, width: 100, x: 10, y: 20 }

describe('outerTargetRect', () => {
  test('puts the left targets on the block left edge', () => {
    expect(outerTargetRect(BLOCK, OuterTargetsEnum.CENTER_LEFT).x).toBe(10)
    expect(outerTargetRect(BLOCK, OuterTargetsEnum.TOP_LEFT).x).toBe(10)
    expect(outerTargetRect(BLOCK, OuterTargetsEnum.BOTTOM_LEFT).x).toBe(10)
  })

  test('insets the right targets by their own width, as `right-0` does', () => {
    expect(outerTargetRect(BLOCK, OuterTargetsEnum.CENTER_RIGHT).x).toBe(108)
    expect(outerTargetRect(BLOCK, OuterTargetsEnum.TOP_RIGHT).x).toBe(108)
  })

  test('centres the middle targets on the block centre', () => {
    expect(outerTargetRect(BLOCK, OuterTargetsEnum.TOP_CENTER).x).toBe(59)
    expect(outerTargetRect(BLOCK, OuterTargetsEnum.CENTER_LEFT).y).toBe(39)
  })

  test('lifts a top target above the block and drops a bottom target below it', () => {
    expect(outerTargetRect(BLOCK, OuterTargetsEnum.TOP_CENTER).y).toBe(16)
    expect(outerTargetRect(BLOCK, OuterTargetsEnum.BOTTOM_CENTER).y).toBe(62)
  })

  test('gives every target the same 2px square', () => {
    for (const name of Object.values(OuterTargetsEnum)) {
      const rect = outerTargetRect(BLOCK, name)
      expect(rect.height).toBe(2)
      expect(rect.width).toBe(2)
    }
  })
})

/** The wrapper and the shape box it pads, as `block-wrapper.tsx` nests them. */
const RECTS = { outer: BLOCK, root: { height: 20, width: 80, x: 20, y: 30 } }

describe('targetRect', () => {
  test('resolves the root target to the shape box, never to the wrapper', () => {
    expect(targetRect(RECTS, 'root-target')).toEqual(RECTS.root)
    expect(targetRect(RECTS, 'root-target')).not.toEqual(RECTS.outer)
  })

  test('splits the combo targets down the middle of the shape box', () => {
    expect(targetRect(RECTS, 'root-target-left')).toEqual({ ...RECTS.root, width: 40 })
    expect(targetRect(RECTS, 'root-target-right')).toEqual({
      ...RECTS.root,
      width: 40,
      x: 60,
    })
  })

  test('puts the outer targets on the wrapper, which is wider than the shape box', () => {
    expect(targetRect(RECTS, OuterTargetsEnum.CENTER_LEFT)?.x).toBe(BLOCK.x)
    expect(targetRect(RECTS, OuterTargetsEnum.CENTER_RIGHT)?.x).toBe(108)
  })

  test('resolves every outer target name', () => {
    for (const name of Object.values(OuterTargetsEnum)) {
      expect(targetRect(RECTS, name)).not.toBeNull()
    }
  })

  test('returns null for a name no target carries, so the arrow is skipped', () => {
    expect(targetRect(RECTS, 'middle-of-nowhere')).toBeNull()
    expect(targetRect(RECTS, '')).toBeNull()
  })
})
