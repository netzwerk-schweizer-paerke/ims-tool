import type { LegacyDocsStatistics } from '../types'

// Simple statistics tracker for legacy docs
export class FetchLegacyDocsTracker {
  private statistics: LegacyDocsStatistics = {
    documentsCreated: 0,
    errors: [],
    failedConversions: 0,
    linksConverted: 0,
    processedFields: 0,
    skippedFields: 0,
    startTime: Date.now(),
    totalLinksFound: 0,
  }

  addError(error: { error: string; timestamp: number; url: string; }): void {
    this.statistics.errors.push(error)
  }

  getStatistics(): LegacyDocsStatistics {
    return this.statistics
  }

  increment(field: keyof LegacyDocsStatistics): void {
    const value = this.statistics[field]
    if (typeof value === 'number') {
      ;(this.statistics[field] as number)++
    }
  }

  initializeStatistics(stats: LegacyDocsStatistics): void {
    this.statistics = stats
  }

  reset(): void {
    this.statistics = {
      documentsCreated: 0,
      errors: [],
      failedConversions: 0,
      linksConverted: 0,
      processedFields: 0,
      skippedFields: 0,
      startTime: Date.now(),
      totalLinksFound: 0,
    }
  }

  updateStatistics(updates: Partial<LegacyDocsStatistics>): void {
    Object.assign(this.statistics, updates)
  }
}
