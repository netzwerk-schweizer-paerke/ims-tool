import { describe, expect, test } from 'vitest'

import { qrMatrix } from './qr-modules'

const URL = 'https://ims.example/share/6DutT9xohVw4lGieiIoneA'

describe('qrMatrix', () => {
  test('returns a square of at least the smallest QR size', () => {
    const { size } = qrMatrix(URL)

    // Version 1 is 21 modules, and every later version adds 4.
    expect(size).toBeGreaterThanOrEqual(21)
    expect((size - 21) % 4).toBe(0)
  })

  test('places the three finder patterns, which every QR code carries', () => {
    const { runs, size } = qrMatrix(URL)
    const dark = new Set(
      runs.flatMap((run) =>
        Array.from({ length: run.length }, (_, i) => `${run.x + i},${run.y}`),
      ),
    )

    // A finder pattern is a 7x7 square with a dark border. Test one corner of each.
    expect(dark.has('0,0')).toBe(true)
    expect(dark.has(`${size - 1},0`)).toBe(true)
    expect(dark.has(`0,${size - 1}`)).toBe(true)
  })

  test('merges an unbroken row into one run', () => {
    const { runs, size } = qrMatrix(URL)
    // The top-left finder's first row is 7 dark modules with a light module after it.
    const firstTopRun = runs.find((run) => run.y === 0)

    expect(firstTopRun).toEqual({ length: 7, x: 0, y: 0 })
    expect(runs.every((run) => run.x + run.length <= size)).toBe(true)
  })

  test('emits fewer runs than dark modules, so the merge does something', () => {
    const { runs } = qrMatrix(URL)
    const darkModules = runs.reduce((total, run) => total + run.length, 0)

    expect(runs.length).toBeLessThan(darkModules)
  })

  test('grows the code when the text grows', () => {
    const short = qrMatrix('https://a.example/s/1')
    const long = qrMatrix(`${URL}/activity/176/block/6a82d9de5b399b00012c5367?locale=de`)

    expect(long.size).toBeGreaterThan(short.size)
  })
})
