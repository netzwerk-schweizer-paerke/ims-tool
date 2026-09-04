'use client'
import { Button, Drawer, useDocumentInfo, useModal, useTranslation } from '@payloadcms/ui'
import { useEffect } from 'react'

import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'
import { focusAnchor, HealthReport } from '@/payload/components/health/health-report'
import { useHealthCheck } from '@/payload/components/health/use-health-check'

const CHECKABLE_COLLECTIONS = new Set(['activities', 'task-flows', 'task-lists'])

const baseClass = 'document-health-button'
const drawerSlug = 'document-health'

/**
 * Runs the same Tier 1 checks against the document being edited, so an author can verify
 * their own item instead of scanning the whole park.
 *
 * Mounted via `admin.components.edit.beforeDocumentControls`, which places it next to Save.
 * It reads the *saved* row — unsaved edits in the open form are not considered, so save
 * first if you want to check what you just typed.
 */
export const DocumentHealthButton = () => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const { collectionSlug, id } = useDocumentInfo()
  const { closeModal, openModal } = useModal()
  const { error, report, run, running } = useHealthCheck()

  // Arriving from the park-wide report, which links with `#blocks-row-N`. The form renders
  // asynchronously, so retry briefly rather than giving up on the first miss. The
  // hashchange listener covers a second jump into an already-open document, which does not
  // remount this component.
  useEffect(() => {
    let timer: null | ReturnType<typeof setInterval> = null

    const focusFromHash = () => {
      const anchor = window.location.hash.replace('#', '')

      if (!anchor.startsWith('blocks-row-')) {
        return
      }

      if (timer) {
        clearInterval(timer)
      }

      // Generous window: a task-flow with many blocks can take tens of seconds to render,
      // and giving up early leaves the user staring at the top of an unrelated form.
      let attempts = 0
      timer = setInterval(() => {
        attempts += 1

        if (focusAnchor(anchor) || attempts > 120) {
          if (timer) clearInterval(timer)
          timer = null
        }
      }, 250)
    }

    focusFromHash()
    window.addEventListener('hashchange', focusFromHash)

    return () => {
      window.removeEventListener('hashchange', focusFromHash)
      if (timer) clearInterval(timer)
    }
  }, [])

  const documentId = Number(id)

  // Nothing to check on the create view, and the endpoint only knows these three.
  if (!id || Number.isNaN(documentId) || !CHECKABLE_COLLECTIONS.has(collectionSlug ?? '')) {
    return null
  }

  const onClick = async () => {
    openModal(drawerSlug)
    await run({
      // Always on here: the link count is bounded by this one document, unlike the
      // park-wide sweep where it would mean hundreds of outbound requests.
      checkExternalUrls: true,
      collection: collectionSlug as 'activities',
      id: documentId,
    })
  }

  return (
    <>
      <Button
        buttonStyle="secondary"
        className={`${baseClass}__open`}
        disabled={running}
        onClick={onClick}
        size="medium">
        {t(running ? 'dataHealth:checking' : 'dataHealth:checkThisItem')}
      </Button>

      {/* No `Header` prop: Payload renders its own header — title plus the close X in the
          top right — but only when Header is `undefined`. Passing `Header={null}`
          suppresses it, leaving the drawer with no way to close from the corner. */}
      <Drawer slug={drawerSlug} title={t('dataHealth:titleDocument')}>
        <div className={'flex w-full max-w-4xl flex-col gap-6'}>
          {running && (
            <p className="text-[var(--theme-text-light)]">{t('dataHealth:checking')}</p>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {report && (
            <HealthReport
              onJump={(anchor) => {
                // Close the drawer first — scrolling underneath it looks like nothing
                // happened.
                closeModal(drawerSlug)
                setTimeout(() => focusAnchor(anchor), 250)
              }}
              report={report}
            />
          )}

          <div className="flex gap-2">
            <Button
              buttonStyle="secondary"
              className={`${baseClass}__close`}
              onClick={() => closeModal(drawerSlug)}>
              {t('general:close')}
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  )
}
