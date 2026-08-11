'use client'
import ky from 'ky'
import { useState } from 'react'

import { TenantHealthReport } from '@/lib/tenant-health-checker'

export type HealthCheckScope =
  | { collection: 'activities' | 'task-flows' | 'task-lists'; id: number }
  | { organisationId: number }

interface UseHealthCheckResult {
  error: string
  report: null | TenantHealthReport
  run: (scope: HealthCheckScope) => Promise<void>
  running: boolean
}

/** Shared by the park-wide check and the per-document check on the edit view. */
export const useHealthCheck = (): UseHealthCheckResult => {
  const [report, setReport] = useState<null | TenantHealthReport>(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')

  const run = async (scope: HealthCheckScope) => {
    setRunning(true)
    setError('')
    setReport(null)

    try {
      const result = await ky
        .post('/api/tenant-health', {
          json: scope,
          // Read-only, but a park with hundreds of documents takes a while to probe.
          timeout: 300_000,
        })
        .json<TenantHealthReport>()

      setReport(result)
    } catch (error_: unknown) {
      setError(await describeError(error_))
    }

    setRunning(false)
  }

  return { error, report, run, running }
}

const describeError = async (caught: unknown): Promise<string> => {
  const httpError = caught as { name?: string; response?: Response }

  if (httpError?.name === 'HTTPError' && httpError.response) {
    try {
      const body = (await httpError.response.clone().json()) as { error?: string }
      if (body?.error) return body.error
    } catch {
      // Not JSON — fall through to the status-only message.
    }
    return `HTTP ${httpError.response.status} error`
  }

  return caught instanceof Error ? caught.message : 'Unknown error occurred'
}
