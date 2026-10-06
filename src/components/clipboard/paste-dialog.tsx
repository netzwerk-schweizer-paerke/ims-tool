'use client'

import { Button, useTranslation } from '@payloadcms/ui'
import { AlertTriangle, XCircle } from 'lucide-react'
import { useEffect, useRef } from 'react'

import type { PasteRun } from '@/components/clipboard/use-paste-run'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { CloneLoadingOverlay } from '@/payload/utilities/cloning/ui/components/clone-loading-overlay'
import { CloneResultsTable } from '@/payload/utilities/cloning/ui/modal/clone-activities/clone-results-table'

type Props = {
  onClose: () => void
  run: PasteRun
}

const TITLE_ID = 'paste-result-title'

/** The wait overlay during a paste, and the result when the paste is not complete (PIMS-83). */
export const PasteDialog = ({ onClose, run }: Props) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const showsResult = run.status === 'result'
  const dialog = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showsResult) {
      return
    }

    // The focus moves into the dialog, so a screen reader announces it and Escape reaches it.
    dialog.current?.focus()

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, showsResult])

  if (run.status === 'running') {
    return (
      <div aria-live={'polite'} role={'status'}>
        <CloneLoadingOverlay
          isVisible={true}
          subtitle={t('clipboard:pastingHint')}
          title={t('clipboard:pasting', { label: run.label })}
        />
      </div>
    )
  }

  if (run.status !== 'result') {
    return null
  }

  const { outcome } = run

  return (
    <div className="bg-[var(--theme-elevation-1000)]/50 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div
        aria-labelledby={TITLE_ID}
        aria-modal={true}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col gap-4 overflow-y-auto rounded-lg border border-[var(--theme-border-color)] bg-[var(--theme-bg)] p-6 shadow-xl"
        ref={dialog}
        role={'dialog'}
        tabIndex={-1}>
        <h2 className="m-0 text-xl" id={TITLE_ID}>
          {t('clipboard:resultTitle')}
        </h2>

        {outcome.kind === 'failed' ? (
          <div className="flex gap-3 rounded-lg border border-[var(--theme-error)] bg-[var(--theme-error-50)] p-4">
            <XCircle className="h-6 w-6 shrink-0 text-[var(--theme-error)]" />
            <div>
              <p className="m-0 font-semibold text-[var(--theme-error-dark)]">
                {t('clipboard:pasteFailed', { error: outcome.error })}
              </p>
              {outcome.details.length > 0 && (
                <ul className="mb-0 mt-2 text-sm text-[var(--theme-error)]">
                  {outcome.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-3 rounded-lg border border-[var(--theme-warning)] bg-[var(--theme-warning-50)] p-4">
              <AlertTriangle className="h-6 w-6 shrink-0 text-[var(--theme-warning)]" />
              <p className="m-0 font-semibold">
                {t('clipboard:pastedWithIssues', { label: run.label })}
              </p>
            </div>
            {/* The clone panels show only a count of system errors. The user needs the text. */}
            {outcome.results.entities.map((entity) => (
              <div className="flex flex-col gap-2" key={String(entity.source.id)}>
                {entity.errors.otherErrors.length > 0 && (
                  <div>
                    <p className="m-0 font-semibold">{t('cloning:systemErrors')}</p>
                    <ul className="mb-0 mt-1 text-sm">
                      {entity.errors.otherErrors.map((error, index) => (
                        <li key={index}>{error.errorMessage}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {entity.errors.missingDocumentFiles.length > 0 && (
                  <div>
                    <p className="m-0 font-semibold">
                      {t('cloning:missingDocumentFiles', {
                        count: entity.errors.missingDocumentFiles.length,
                      })}
                    </p>
                    <ul className="mb-0 mt-1 text-sm">
                      {entity.errors.missingDocumentFiles.map((file, index) => (
                        <li key={index}>
                          {file.fileName} —{' '}
                          {t('cloning:documentLocation', {
                            document: file.documentName,
                            location: file.usageLocation,
                          })}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <details>
                  <summary className="cursor-pointer text-sm">{t('cloning:showDetails')}</summary>
                  <div className="mt-2">
                    <CloneResultsTable statistics={entity} />
                  </div>
                </details>
              </div>
            ))}
          </>
        )}

        <div className="flex justify-end">
          <Button buttonStyle={'primary'} margin={false} onClick={onClose}>
            {t('general:close')}
          </Button>
        </div>
      </div>
    </div>
  )
}
