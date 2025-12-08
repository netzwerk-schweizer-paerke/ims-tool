import { anchorCustomPositionType } from '../types'
import { dimensionType } from '../privateTypes'

type AnchorOffsets = {
  middle: { x: number; y: number }
  left: { x: number; y: number }
  right: { x: number; y: number }
  top: { x: number; y: number }
  bottom: { x: number; y: number }
}

const getAnchorsDefaultOffsets = (width: number, height: number): AnchorOffsets => {
  return {
    middle: { x: width * 0.5, y: height * 0.5 },
    left: { x: 0, y: height * 0.5 },
    right: { x: width, y: height * 0.5 },
    top: { x: width * 0.5, y: 0 },
    bottom: { x: width * 0.5, y: height },
  }
}

export const calcAnchors = (
  anchors: anchorCustomPositionType[],
  anchorPos: dimensionType,
): { x: number; y: number; anchor: anchorCustomPositionType }[] => {
  // now prepare this list of anchors to object expected by the `getShortestLine` function
  return anchors.map((anchor) => {
    let defsOffsets = getAnchorsDefaultOffsets(
      anchorPos.right - anchorPos.x,
      anchorPos.bottom - anchorPos.y,
    )
    // Type assertion needed because anchor.position can be 'auto' | 'middle' | etc
    // but after parsing in useXarrowProps, 'auto' is replaced with actual positions
    let { x, y } = defsOffsets[anchor.position as keyof AnchorOffsets]
    return {
      x: anchorPos.x + x + (anchor.offset?.x ?? 0),
      y: anchorPos.y + y + (anchor.offset?.y ?? 0),
      anchor: anchor,
    }
  })
}
