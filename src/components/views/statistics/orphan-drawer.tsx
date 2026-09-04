'use client'
import { Button, Drawer, useTranslation } from '@payloadcms/ui'
import ky from 'ky'
import { useState } from 'react'

import type { OrphanDeletionResult, OrphanReport } from '@/lib/s3-orphan-detector'

import { formatBytes, formatCount } from '@/lib/admin-stats/format'
import { coversWholeBucket, ORPHAN_DELETE_ENABLED } from '@/lib/s3-orphan-safety'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

export const ORPHAN_DRAWER = 'statistics-s3-orphans'

type Props = {
  /** The Payload admin language, which drives every number in this drawer. */
  locale: string
}

export const OrphanDrawer = ({ locale }: Props) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const [report, setReport] = useState<null | OrphanReport>(null)
  const [result, setResult] = useState<null | OrphanDeletionResult>(null)
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // The server refuses a request the client could not rule out, and answers 409 with the
  // result body. Name the reason, because `HTTP 409` tells the operator nothing.
  const refusalMessages: Record<string, string> = {
    'covers-whole-bucket': t('statistics:orphanDelete:refusedWholeBucket'),
    'reference-scan-failed': t('statistics:orphanDelete:refusedScanFailed'),
  }
  const confirmWord = t('statistics:orphanDelete:confirmWord')
  const deleteLabel = t('statistics:orphanDelete:button')
  const runningLabel = t('statistics:orphanDelete:running')
  const orphanKeys = report?.orphanKeys ?? []
  // A report that flags every object has failed to build the reference set. The endpoint
  // refuses such a request as well; this keeps the button from offering it at all.
  const wholeBucket = coversWholeBucket(orphanKeys.length, report?.summary.totalS3Objects ?? 0)
  const armed =
    ORPHAN_DELETE_ENABLED &&
    confirmation.trim() === confirmWord &&
    orphanKeys.length > 0 &&
    !wholeBucket

  const runReport = async () => {
    setBusy(true)
    setError('')
    setResult(null)
    setConfirmation('')

    try {
      // A full bucket listing plus a scan of every record. It is slow by nature.
      const next = await ky.get('/api/s3-orphan-detection', { timeout: 300_000 }).json<OrphanReport>()
      setReport(next)
    } catch (error_) {
      setError(await describeError(error_))
    }

    setBusy(false)
  }

  const runDelete = async () => {
    setBusy(true)
    setError('')

    try {
      const next = await ky
        .post('/api/s3-orphan-delete', { json: { keys: orphanKeys }, timeout: 300_000 })
        .json<OrphanDeletionResult>()

      setResult(next)
      // The report is now stale: the keys it lists no longer exist. Force a fresh run
      // before a second delete, so nobody deletes from a list that has already been applied.
      setReport(null)
      setConfirmation('')
    } catch (error_) {
      setError(await describeError(error_, refusalMessages))
    }

    setBusy(false)
  }

  return (
    <Drawer slug={ORPHAN_DRAWER} title={t('statistics:maintenance:orphanReport')}>
      <div className={'flex w-full max-w-4xl flex-col gap-6'}>
        {error ? (
          <p className={'m-0 rounded-md border p-3 [border-color:var(--theme-error-250)] [color:var(--theme-error-600)]'}>
            {error}
          </p>
        ) : null}

        {result ? (
          <div className={'flex flex-col gap-1 rounded-md border p-3 text-sm [border-color:var(--theme-border-color)]'}>
            <span>
              {t('statistics:orphanDelete:deleted', { count: result.deleted.length })}{' '}
              {formatBytes(result.freedBytes, locale)}
            </span>
            {result.skipped.length > 0 ? (
              <span>{t('statistics:orphanDelete:skipped', { count: result.skipped.length })}</span>
            ) : null}
            {result.failed.length > 0 ? (
              <span className={'[color:var(--theme-error-600)]'}>
                {t('statistics:orphanDelete:failed', { count: result.failed.length })}
              </span>
            ) : null}
          </div>
        ) : null}

        {report ? (
          <div className={'flex flex-col gap-3 text-sm'}>
            <p className={'m-0 [color:var(--theme-elevation-500)]'}>
              {formatCount(report.summary.totalS3Objects, locale)} ·{' '}
              {formatCount(report.summary.totalReferencedFiles, locale)} ·{' '}
              {formatCount(report.summary.orphanedCount, locale)} ·{' '}
              {report.summary.totalOrphanedSizeFormatted}
            </p>
            <ul className={'m-0 flex list-none flex-col gap-2 p-0'}>
              {report.orphansByPrefix.map((group) => (
                <li className={'flex flex-col gap-1'} key={group.prefix}>
                  <span className={'font-semibold'}>
                    {group.prefix} — {formatCount(group.count, locale)} ·{' '}
                    {formatBytes(group.totalSize, locale)}
                  </span>
                  <ul className={'m-0 flex list-none flex-col p-0 [color:var(--theme-elevation-500)]'}>
                    {group.objects.map((object) => (
                      <li className={'truncate'} key={object.key}>
                        {object.key} — {object.sizeFormatted}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={'flex flex-col gap-3 border-t pt-4 [border-color:var(--theme-border-color)]'}>
          <h3 className={'m-0 text-sm font-semibold [color:var(--theme-text)]'}>
            {t('statistics:orphanDelete:title')}
          </h3>

          {ORPHAN_DELETE_ENABLED && wholeBucket ? (
            <p
              className={
                'm-0 rounded-md border p-3 text-sm [border-color:var(--theme-error-250)] [color:var(--theme-error-600)]'
              }>
              {t('statistics:orphanDelete:refusedWholeBucket')}
            </p>
          ) : null}

          {ORPHAN_DELETE_ENABLED ? null : (
            <p
              className={
                'm-0 rounded-md border p-3 text-sm [border-color:var(--theme-error-250)] [color:var(--theme-error-600)]'
              }>
              {t('statistics:orphanDelete:disarmed')}
            </p>
          )}

          {ORPHAN_DELETE_ENABLED && orphanKeys.length > 0 && !wholeBucket ? (
            <>
              <p className={'m-0 text-sm'}>
                {t('statistics:orphanDelete:summary', {
                  count: orphanKeys.length,
                  size: formatBytes(report?.summary.totalOrphanedSize ?? 0, locale),
                })}
              </p>
              <label className={'flex flex-col gap-1 text-sm'}>
                <span className={'[color:var(--theme-elevation-500)]'}>
                  {t('statistics:orphanDelete:confirmHint', { word: confirmWord })}
                </span>
                <input
                  className={'rounded border p-2 [background-color:var(--theme-input-bg)] [border-color:var(--theme-border-color)] [color:var(--theme-text)]'}
                  disabled={busy}
                  onChange={(event) => setConfirmation(event.target.value)}
                  type={'text'}
                  value={confirmation}
                />
              </label>
            </>
          ) : null}

          {orphanKeys.length === 0 && !wholeBucket ? (
            <p className={'m-0 text-sm [color:var(--theme-elevation-500)]'}>
              {t('statistics:orphanDelete:nothingToDelete')}
            </p>
          ) : null}

          <div className={'flex gap-2'}>
            <Button buttonStyle={'secondary'} disabled={busy} onClick={runReport}>
              {t('statistics:maintenance:orphanReport')}
            </Button>
            <Button buttonStyle={'error'} disabled={busy || !armed} onClick={runDelete}>
              {busy ? runningLabel : deleteLabel}
            </Button>
          </div>
        </div>
      </div>
    </Drawer>
  )
}

const describeError = async (
  caught: unknown,
  refusalMessages: Record<string, string> = {},
): Promise<string> => {
  const httpError = caught as { name?: string; response?: Response }

  if (httpError?.name === 'HTTPError' && httpError.response) {
    try {
      const body = (await httpError.response.clone().json()) as {
        error?: string
        refusedReason?: string
      }
      if (body?.refusedReason) return refusalMessages[body.refusedReason] ?? body.refusedReason
      if (body?.error) return body.error
    } catch {
      // Not JSON — fall through to the status-only message.
    }

    return `HTTP ${httpError.response.status}`
  }

  return caught instanceof Error ? caught.message : 'Unknown error'
}
