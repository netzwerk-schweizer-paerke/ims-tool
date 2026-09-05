import { describe, expect, test } from 'vitest'

import { ProcessTaskCompoundBlock } from '@/components/views/flow/flow-block'

import { resolveBlockArrows } from './resolve-block-arrows'

type Connection = { position: string; type: string }

const ioBlock = (connections: Connection[]): ProcessTaskCompoundBlock =>
  ({
    blockType: 'proc-task-io',
    graph: {
      io: { connections, enabled: true, text: 'An input' },
      task: { connections: [], text: 'A task' },
    },
    id: 'b1',
  }) as unknown as ProcessTaskCompoundBlock

const parallelBlock = (connections: Connection[]): ProcessTaskCompoundBlock =>
  ({
    blockType: 'proc-task-p',
    graph: { task: { connections, textLeft: 'Left', textRight: 'Right' } },
    id: 'b2',
  }) as unknown as ProcessTaskCompoundBlock

describe('resolveBlockArrows', () => {
  test('ends an outgoing io arrow on the task half beside it', () => {
    const [arrow] = resolveBlockArrows(ioBlock([{ position: 'right', type: 'out' }]))

    expect(arrow.start).toEqual({ halfId: 'b1-left', target: 'root-target' })
    expect(arrow.end).toEqual({ halfId: 'b1-right', target: 'root-target' })
  })

  test('starts an incoming io arrow on the task half beside it', () => {
    const [arrow] = resolveBlockArrows(ioBlock([{ position: 'right', type: 'in' }]))

    expect(arrow.start).toEqual({ halfId: 'b1-right', target: 'root-target' })
    expect(arrow.end).toEqual({ halfId: 'b1-left', target: 'root-target' })
  })

  test('keeps a task arrow on its own half', () => {
    const block = ioBlock([])
    block.graph = {
      ...block.graph,
      task: { connections: [{ position: 'bottom', type: 'out' }], text: 'A task' },
    } as ProcessTaskCompoundBlock['graph']

    const [arrow] = resolveBlockArrows(block)

    expect(arrow.start).toEqual({ halfId: 'b1-right', target: 'root-target' })
    expect(arrow.end).toEqual({ halfId: 'b1-right', target: 'bottom-center' })
  })

  test('draws a parallel block once, and points each root name at its own half', () => {
    const arrows = resolveBlockArrows(parallelBlock([{ position: 'top', type: 'in' }]))

    expect(arrows).toHaveLength(2)
    expect(arrows[0].end).toEqual({ halfId: 'b2-left', target: 'root-target' })
    expect(arrows[1].end).toEqual({ halfId: 'b2-right', target: 'root-target' })
    expect(arrows[0].start).toEqual({ halfId: 'b2-right', target: 'top-center' })
  })

  test('sends both roots of a parallel block down one bottom target', () => {
    const arrows = resolveBlockArrows(parallelBlock([{ position: 'bottom', type: 'out' }]))

    expect(arrows).toHaveLength(2)
    expect(arrows.map((arrow) => arrow.end)).toEqual([
      { halfId: 'b2-right', target: 'bottom-center' },
      { halfId: 'b2-right', target: 'bottom-center' },
    ])
    expect(arrows[0].start).toEqual({ halfId: 'b2-left', target: 'root-target' })
    expect(arrows[1].start).toEqual({ halfId: 'b2-right', target: 'root-target' })
  })

  test('skips a connection whose type no definition knows', () => {
    expect(resolveBlockArrows(ioBlock([{ position: 'right', type: 'sideways' }]))).toEqual([])
  })
})
