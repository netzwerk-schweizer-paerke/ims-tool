import type { LegacyDocsStatistics } from '../types'

// Simple statistics tracker for legacy docs
export class FetchLegacyDocsTracker {
  private statistics: LegacyDocsStatistics = {
    startTime: Date.now(),
    totalLinksFound: 0,
    documentsCreated: 0,
    linksConverted: 0,
    failedConversions: 0,
    errors: [],
    processedFields: 0,
    skippedFields: 0,
  }

  initializeStatistics(stats: LegacyDocsStatistics): void {
    this.statistics = stats
  }

  getStatistics(): LegacyDocsStatistics {
    return this.statistics
  }

  updateStatistics(updates: Partial<LegacyDocsStatistics>): void {
    Object.assign(this.statistics, updates)
  }

  increment(field: keyof LegacyDocsStatistics): void {
    const value = this.statistics[field]
    if (typeof value === 'number') {
      ;(this.statistics[field] as number)++
    }
  }

  addError(error: { url: string; error: string; timestamp: number }): void {
    this.statistics.errors.push(error)
  }

  reset(): void {
    this.statistics = {
      startTime: Date.now(),
      totalLinksFound: 0,
      documentsCreated: 0,
      linksConverted: 0,
      failedConversions: 0,
      errors: [],
      processedFields: 0,
      skippedFields: 0,
    }
  }
}
