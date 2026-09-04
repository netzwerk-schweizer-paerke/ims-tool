import { describe, expect, test } from 'vitest'

import { CloneStatisticsTracker } from './clone-statistics-tracker'

const missingFile = (fileName: string) => ({
  documentId: 1,
  documentName: 'A document',
  error: 'HTTP error: 403 Forbidden',
  fileName,
  usageLocation: 'activities rich text field',
})

/** Instances live in a static map keyed by transaction id, so every test needs its own key. */
const trackerFor = (transactionId: string) => CloneStatisticsTracker.getInstance(transactionId)

describe('CloneStatisticsTracker completeness', () => {
  test('reports 100 when every source file reached the clone', () => {
    const tracker = trackerFor('tx-complete')
    tracker.startEntity(1)
    tracker.addSourceDocument()
    tracker.addSourceDocument()
    tracker.addClonedDocument()
    tracker.addClonedDocument()
    tracker.setCloneInfo(2, 'Clone', 'activities')
    tracker.endEntity()

    const result = tracker.finalize()

    expect(result.entities[0].percentComplete).toBe(100)
    expect(result.aggregated.percentComplete).toBe(100)
    expect(result.successLevel).toBe('success')
  })

  test('reports 50 when one file of two failed', () => {
    const tracker = trackerFor('tx-partial')
    tracker.startEntity(1)
    tracker.addSourceDocument()
    tracker.addSourceDocument()
    tracker.addClonedDocument()
    tracker.addMissingFileError(missingFile('norm.docx'))
    tracker.setCloneInfo(2, 'Clone', 'activities')
    tracker.endEntity()

    const result = tracker.finalize()

    expect(result.entities[0].percentComplete).toBe(50)
    expect(result.aggregated.percentComplete).toBe(50)
    expect(result.successLevel).toBe('partial')
  })

  // The previous formula subtracted the error count from a total that already excluded it.
  // Two failures of two source files reported -100, which the result screen rendered verbatim.
  test('reports 0 when every file failed, never a negative value', () => {
    const tracker = trackerFor('tx-all-files-failed')
    tracker.startEntity(1)
    tracker.addSourceDocument()
    tracker.addSourceDocument()
    tracker.addMissingFileError(missingFile('plan.pdf'))
    tracker.addMissingFileError(missingFile('norm.docx'))
    tracker.setCloneInfo(2, 'Clone', 'activities')
    tracker.endEntity()

    const result = tracker.finalize()

    expect(result.entities[0].percentComplete).toBe(0)
    expect(result.aggregated.percentComplete).toBe(0)
    expect(result.successLevel).toBe('partial')
  })

  test('reports 100 for an entity that carries no files', () => {
    const tracker = trackerFor('tx-no-files')
    tracker.startEntity(1)
    tracker.setCloneInfo(2, 'Clone', 'activities')
    tracker.endEntity()

    expect(tracker.finalize().entities[0].percentComplete).toBe(100)
  })

  test('sums both entities into the aggregate', () => {
    const tracker = trackerFor('tx-two-entities')

    tracker.startEntity(1)
    tracker.addSourceDocument()
    tracker.addClonedDocument()
    tracker.setCloneInfo(11, 'Clone one', 'activities')
    tracker.endEntity()

    tracker.startEntity(2)
    tracker.addSourceDocument()
    tracker.addMissingFileError(missingFile('plan.pdf'))
    tracker.setCloneInfo(12, 'Clone two', 'activities')
    tracker.endEntity()

    const result = tracker.finalize()

    expect(result.aggregated.source.documentFilesCount).toBe(2)
    expect(result.aggregated.cloned.documentFilesCount).toBe(1)
    expect(result.aggregated.percentComplete).toBe(50)
  })
})
