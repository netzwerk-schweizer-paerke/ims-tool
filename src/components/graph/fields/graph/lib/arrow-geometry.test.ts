import { anchorPoint, ArrowSpec, buildArrow, Rect } from './arrow-geometry'

// A block shape and the two outer markers a real definition connects it to. The marker is
// 2x2px and sits 4px outside the block box, which is what `OuterTargets` renders.
const root: Rect = { height: 60, width: 100, x: 50, y: 40 }
const topCenter: Rect = { height: 2, width: 2, x: 100, y: 0 }
const bottomCenter: Rect = { height: 2, width: 2, x: 100, y: 120 }
const bottomRight: Rect = { height: 2, width: 2, x: 198, y: 118 }
const centerRight: Rect = { height: 2, width: 2, x: 198, y: 69 }
// The top markers sit 4px above the layer, so their coordinates are negative.
const topRight: Rect = { height: 2, width: 2, x: 198, y: -4 }

describe('anchorPoint', () => {
  it('places each side at the middle of that edge', () => {
    expect(anchorPoint(root, 'top')).toEqual({ x: 100, y: 40 })
    expect(anchorPoint(root, 'bottom')).toEqual({ x: 100, y: 100 })
    expect(anchorPoint(root, 'left')).toEqual({ x: 50, y: 70 })
    expect(anchorPoint(root, 'right')).toEqual({ x: 150, y: 70 })
  })
})

describe('buildArrow', () => {
  it('draws a vv arrow with a head, and breaks halfway less the head clearance', () => {
    // The `top: in` record of every block: the marker above points down into the shape.
    const spec: ArrowSpec = {
      end: 'root-target',
      endAnchor: 'top',
      start: 'top-center',
      startAnchor: 'bottom',
    }

    expect(buildArrow(spec, topCenter, root)).toEqual({
      d: 'M 101 2 L 101 16.5 L 100 16.5 L 100 31',
      head: { orient: 450, scale: 12, x: 106, y: 28 },
    })
  })

  it('draws a vv arrow with no head, and breaks exactly halfway', () => {
    // The `bottom: out` record: the shape points down at the marker below, no head.
    const spec: ArrowSpec = {
      end: 'bottom-center',
      endAnchor: 'top',
      showHead: false,
      showTail: false,
      start: 'root-target',
      startAnchor: 'bottom',
    }

    expect(buildArrow(spec, root, bottomCenter)).toEqual({
      d: 'M 100 100 L 100 110 L 101 110 L 101 120',
      head: null,
    })
  })

  it('draws an hv arrow as one corner, horizontal first', () => {
    // The activity `right: out-bottom` record.
    const spec: ArrowSpec = {
      end: 'bottom-right',
      endAnchor: 'top',
      showHead: false,
      showTail: false,
      start: 'root-target',
      startAnchor: 'right',
    }

    expect(buildArrow(spec, root, bottomRight)).toEqual({
      d: 'M 150 70 L 199 70 L 199 118 L 199 118',
      head: null,
    })
  })

  it('draws a vh arrow as one corner, vertical first, and shortens for the head', () => {
    // The activity `right: in-bottom` record.
    const spec: ArrowSpec = {
      end: 'root-target',
      endAnchor: 'right',
      start: 'bottom-right',
      startAnchor: 'top',
    }

    expect(buildArrow(spec, bottomRight, root)).toEqual({
      d: 'M 199 118 L 199 70 L 159 70 L 159 70',
      head: { orient: 180, scale: 12, x: 162, y: 76 },
    })
  })

  it('draws an hh arrow with a head on a purely horizontal run', () => {
    // The flows/io `right: in` record. Both deltas share a sign convention, and dy is 0.
    const spec: ArrowSpec = {
      end: 'root-target',
      endAnchor: 'right',
      start: 'center-right',
      startAnchor: 'left',
    }

    expect(buildArrow(spec, centerRight, root)).toEqual({
      d: 'M 198 70 L 178.5 70 L 178.5 70 L 159 70',
      head: { orient: 180, scale: 12, x: 162, y: 76 },
    })
  })

  it('points the head the other way when the end anchor is left', () => {
    // The flows/io `right: out` record. This is the only path through headOrient 0.
    const spec: ArrowSpec = {
      end: 'center-right',
      endAnchor: 'left',
      start: 'root-target',
      startAnchor: 'right',
    }

    expect(buildArrow(spec, root, centerRight)).toEqual({
      d: 'M 150 70 L 169.5 70 L 169.5 70 L 189 70',
      head: { orient: 0, scale: 12, x: 186, y: 64 },
    })
  })

  it('draws an upward vv arrow into a negative coordinate', () => {
    // The test block's `right: out-top` second record. The top marker sits above the layer.
    const spec: ArrowSpec = {
      end: 'top-right',
      endAnchor: 'bottom',
      showHead: false,
      showTail: false,
      start: 'center-right',
      startAnchor: 'top',
    }

    expect(buildArrow(spec, centerRight, topRight)).toEqual({
      d: 'M 199 69 L 199 33.5 L 199 33.5 L 199 -2',
      head: null,
    })
  })

  it('defaults showHead to true when a record omits it', () => {
    const withoutFlag = buildArrow(
      { end: 'root-target', endAnchor: 'top', start: 'top-center', startAnchor: 'bottom' },
      topCenter,
      root,
    )
    const withFlag = buildArrow(
      {
        end: 'root-target',
        endAnchor: 'top',
        showHead: true,
        start: 'top-center',
        startAnchor: 'bottom',
      },
      topCenter,
      root,
    )

    expect(withoutFlag).toEqual(withFlag)
  })
})
