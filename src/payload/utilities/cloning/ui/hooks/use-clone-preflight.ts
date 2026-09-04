'use client'
import ky from 'ky'
import { useRef, useState } from 'react'

import { TenantHealthFinding, TenantHealthReport } from '@/lib/tenant-health-checker'

import {
  CloneableCollectionSlug,
  ClonePreflightOutcome,
  UseClonePreflightResult,
} from './types'

/**
 * The document scope reads with `overrideAccess: false`, so it costs one request per row.
 * Five at a time matches the batch size the document preloader uses on the server.
 */
const BATCH_SIZE = 5

/**
 * Runs the tenant health check over the selected rows before the clone starts.
 *
 * Every blocking finding names a condition that makes `payload.create` or `findByID` throw.
 * The clone endpoint rolls the whole batch back on the first throw, so one unchecked row
 * cancels every other selection. This reports which row it is, before any write.
 */
export function useClonePreflight(): UseClonePreflightResult {
  const [checking, setChecking] = useState(false)
  const [failed, setFailed] = useState(false)
  const [report, setReport] = useState<null | TenantHealthReport>(null)
  // A report describes one selection. A changed selection supersedes a run still in flight,
  // whose result would otherwise land and describe rows the user has since deselected.
  const currentRun = useRef(0)

  const clear = () => {
    currentRun.current += 1
    setFailed(false)
    setReport(null)
  }

  const run = async (
    collection: CloneableCollectionSlug,
    ids: number[],
  ): Promise<ClonePreflightOutcome> => {
    const token = ++currentRun.current

    setChecking(true)
    setFailed(false)
    setReport(null)

    try {
      const reports = await runInBatches(collection, ids)

      if (token !== currentRun.current) {
        return { status: 'superseded' }
      }

      const merged = mergeReports(reports)
      setReport(merged)
      return { report: merged, status: 'checked' }
    } catch {
      if (token !== currentRun.current) {
        return { status: 'superseded' }
      }

      // The check is an aid, never a gate on its own failure. A user who cannot reach it
      // must still be able to clone, and the endpoint reports the real error either way.
      setFailed(true)
      return { status: 'failed' }
    } finally {
      if (token === currentRun.current) {
        setChecking(false)
      }
    }
  }

  return { checking, clear, failed, report, run }
}

const countSeverity = (findings: TenantHealthFinding[], severity: 'blocking' | 'degrading') =>
  findings.filter((finding) => finding.severity === severity).length

/**
 * Folds the per-row reports into the one shape `HealthReport` renders.
 *
 * `counts` and `organisation` come from the first row. Both describe the park, which is the
 * same for every selected row, so a sum would report the park once per selection.
 */
const mergeReports = (reports: TenantHealthReport[]): TenantHealthReport => {
  const findings = reports.flatMap((report) => report.findings)
  const first = reports[0]

  return {
    checkedAt: new Date().toISOString(),
    counts: first?.counts ?? { activities: 0, documents: 0, taskFlows: 0, taskLists: 0 },
    findings,
    organisation: first?.organisation ?? { id: 0, name: '' },
    preconditions: first?.preconditions ?? { s3: { ok: true } },
    summary: {
      blocking: countSeverity(findings, 'blocking'),
      degrading: countSeverity(findings, 'degrading'),
      healthy: findings.length === 0,
    },
  }
}

const runInBatches = async (
  collection: CloneableCollectionSlug,
  ids: number[],
): Promise<TenantHealthReport[]> => {
  const reports: TenantHealthReport[] = []

  for (let index = 0; index < ids.length; index += BATCH_SIZE) {
    const batch = ids.slice(index, index + BATCH_SIZE)

    const batchReports = await Promise.all(
      batch.map((id) =>
        ky
          .post('/api/tenant-health', {
            json: { collection, id },
            timeout: 120_000,
          })
          .json<TenantHealthReport>(),
      ),
    )

    reports.push(...batchReports)
  }

  return reports
}
