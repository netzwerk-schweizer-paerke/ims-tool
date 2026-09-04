import qrcode from 'qrcode-generator'

export type QrMatrix = {
  /** The dark modules, merged into horizontal runs. */
  runs: QrRun[]
  /** The module count per side, with no quiet zone. */
  size: number
}

export type QrRun = {
  /** How many modules the run covers, to the right of `x`. */
  length: number
  x: number
  y: number
}

/**
 * Encodes a URL and merges each row's dark modules into horizontal runs.
 *
 * A run becomes one rectangle in the PDF. A 33-module code holds about 550 dark modules and far
 * fewer runs, so the merge keeps the drawing small and the code stays vector.
 */
export const qrMatrix = (text: string): QrMatrix => {
  const code = qrcode(0, 'M')
  code.addData(text)
  code.make()

  const size = code.getModuleCount()
  const runs: QrRun[] = []

  for (let y = 0; y < size; y++) {
    let start: null | number = null

    for (let x = 0; x < size; x++) {
      const dark = code.isDark(y, x)

      if (dark && start === null) {
        start = x
      }

      if (!dark && start !== null) {
        runs.push({ length: x - start, x: start, y })
        start = null
      }
    }

    if (start !== null) {
      runs.push({ length: size - start, x: start, y })
    }
  }

  return { runs, size }
}
