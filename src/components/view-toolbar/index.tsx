'use client'

import { Button, Drawer, useDrawerSlug, useModal, useTranslation } from '@payloadcms/ui'
import { useCallback, useEffect, useRef, useState } from 'react'

import { DateTime } from '@/components/date-time'
import { EXPIRY_MONTH_OPTIONS } from '@/lib/share-link-expiry'
import { buildShareUrl, ShareTarget } from '@/lib/share-link-target'
import { Translate } from '@/lib/translate'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

const MESSAGE_MS = 3000

/** The select value that stands for a link with no expiry. */
const UNLIMITED = ''

type Message = 'copied' | 'deleted' | 'error'

const MESSAGE_KEYS: Record<Message, I18nKeys> = {
  copied: 'shareLink:copied',
  deleted: 'shareLink:deleted',
  error: 'shareLink:error',
}

export type ShareLinkRef = {
  /** Resolved on the server, so no clock runs during the render. */
  expired: boolean
  expiresAt: null | string
  id: number
  token: string
}

type Props = {
  editHref: string
  /** Every link this user made for this page, newest first, resolved on the server. */
  existingLinks: ShareLinkRef[]
  locale: string
  target: ShareTarget
}

const isShareLinkRef = (value: unknown): value is { id: number; token: string } =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'number' &&
  'token' in value &&
  typeof value.token === 'string'

/** The create answers with the stored row, whose `expiresAt` the server computed. */
const expiryOf = (doc: object): null | string =>
  'expiresAt' in doc && typeof doc.expiresAt === 'string' ? doc.expiresAt : null

const warn = (message: string) => {
  // A client component must not import the tslog logger, which would reach the browser bundle.
  if (process.env.NODE_ENV === 'development') {
    console.warn(`view-toolbar: ${message}`)
  }
}

/**
 * The edit and share actions of a read-only view. It sits on the row of the last-updated line,
 * on the outer right.
 *
 * The share action opens a dialog that lists every link this user made for the page. Each link
 * carries its own expiry and its own delete action, so one recipient loses access alone.
 */
export const ViewToolbar = ({ editHref, existingLinks, locale, target }: Props) => {
  const drawerSlug = useDrawerSlug('share-link')
  const { closeModal, openModal } = useModal()
  const { t } = useTranslation<I18nObject, I18nKeys>()

  const [links, setLinks] = useState<ShareLinkRef[]>(existingLinks)
  const [origin, setOrigin] = useState<null | string>(null)
  const [months, setMonths] = useState<string>(UNLIMITED)
  const [message, setMessage] = useState<Message | null>(null)
  const [busy, setBusy] = useState(false)
  const timeout = useRef<null | ReturnType<typeof setTimeout>>(null)

  const hasLiveLink = links.some((link) => !link.expired)

  useEffect(
    () => () => {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
    },
    [],
  )

  const showMessage = useCallback((next: Message) => {
    setMessage(next)
    if (timeout.current) {
      clearTimeout(timeout.current)
    }
    timeout.current = setTimeout(() => setMessage(null), MESSAGE_MS)
  }, [])

  /** The admin export names its target in the query. The endpoint reads the park from the session. */
  const downloadPdf = useCallback(
    (deep: boolean) => {
      const query = new URLSearchParams({ locale })

      if (deep) {
        query.set('deep', '1')
      }

      switch (target.targetType) {
        case 'activityBlock': {
          query.set('target', 'activityBlock')
          query.set('activity', String(target.activity))
          query.set('block', target.blockId)
          break
        }
        case 'activityLandscape': {
          query.set('target', 'landscape')
          break
        }
        case 'flow': {
          query.set('target', 'flow')
          query.set('flow', String(target.taskFlow))
          break
        }
        case 'list': {
          query.set('target', 'list')
          query.set('list', String(target.taskList))
          break
        }
      }

      window.location.assign(`/api/process-pdf?${query.toString()}`)
    },
    [locale, target],
  )

  /** `window` is read in the handler, never in the render, so the server and the client agree. */
  const handleOpen = useCallback(() => {
    openModal(drawerSlug)
    setMessage(null)
    setOrigin(window.location.origin)
  }, [drawerSlug, openModal])

  const urlOf = (token: string) =>
    origin ? buildShareUrl({ locale, origin, token }) : ''

  const handleCreate = useCallback(async () => {
    if (busy) {
      return
    }
    setBusy(true)

    try {
      const response = await fetch('/api/share-links', {
        body: JSON.stringify({
          ...target,
          expiresInMonths: months === UNLIMITED ? null : Number(months),
          locale,
        }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error(`the create answered ${response.status}`)
      }

      const body: unknown = await response.json()
      const doc =
        typeof body === 'object' && body !== null && 'doc' in body
          ? (body as { doc: unknown }).doc
          : null

      if (!isShareLinkRef(doc)) {
        throw new Error('the create returned no token')
      }

      // A link the server just minted always outlives this moment.
      const created: ShareLinkRef = {
        expired: false,
        expiresAt: expiryOf(doc),
        id: doc.id,
        token: doc.token,
      }

      setLinks((previous) => [created, ...previous])
    } catch (error) {
      warn(error instanceof Error ? error.message : 'the create failed')
      showMessage('error')
    } finally {
      setBusy(false)
    }
  }, [busy, locale, months, showMessage, target])

  const handleCopy = useCallback(
    async (token: string) => {
      if (!origin) {
        return
      }

      try {
        await navigator.clipboard.writeText(buildShareUrl({ locale, origin, token }))
        showMessage('copied')
      } catch (error) {
        warn(error instanceof Error ? error.message : 'the copy failed')
        showMessage('error')
      }
    },
    [locale, origin, showMessage],
  )

  const handleDelete = useCallback(
    async (id: number) => {
      if (busy) {
        return
      }
      setBusy(true)

      try {
        const response = await fetch(`/api/share-links/${id}`, {
          credentials: 'include',
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error(`the delete answered ${response.status}`)
        }

        // The dialog stays open, because the list may still hold other links.
        setLinks((previous) => previous.filter((link) => link.id !== id))
        showMessage('deleted')
      } catch (error) {
        warn(error instanceof Error ? error.message : 'the delete failed')
        showMessage('error')
      } finally {
        setBusy(false)
      }
    },
    [busy, showMessage],
  )

  return (
    <div className={'flex flex-row items-center gap-2'}>
      <Button
        buttonStyle={'secondary'}
        el={'link'}
        icon={['edit']}
        iconPosition={'left'}
        margin={false}
        size={'small'}
        url={editHref}>
        <Translate k={'common:edit'} />
      </Button>
      <Button
        buttonStyle={'secondary'}
        margin={false}
        onClick={() => downloadPdf(false)}
        secondaryActions={{ label: t('pdf:downloadAll'), onClick: () => downloadPdf(true) }}
        size={'small'}
        tooltip={t('pdf:downloadPage')}>
        <Translate k={'pdf:download'} />
      </Button>
      <Button
        buttonStyle={'secondary'}
        margin={false}
        onClick={handleOpen}
        size={'small'}
        tooltip={hasLiveLink ? t('shareLink:isShared') : undefined}>
        {hasLiveLink && (
          <span
            aria-hidden={true}
            className={'mr-2 inline-block h-2 w-2 rounded-full align-middle'}
            style={{ background: 'var(--theme-success-500, #22c55e)' }}
          />
        )}
        {/* Two static keys, because the i18n parser cannot extract a computed one. */}
        {hasLiveLink ? <Translate k={'shareLink:shared'} /> : <Translate k={'shareLink:share'} />}
      </Button>
      <Drawer slug={drawerSlug} title={''}>
        <div className={'flex max-w-2xl flex-col gap-4'}>
          <h2 className={'text-xl font-bold'}>
            <Translate k={'shareLink:title'} />
          </h2>
          <p>
            <Translate
              k={
                target.targetType === 'activityLandscape'
                  ? 'shareLink:scopeLandscape'
                  : 'shareLink:scopePage'
              }
            />
          </p>
          <p>
            <Translate k={'shareLink:noAccount'} />
          </p>
          <p>
            <Translate k={'shareLink:whoCanDelete'} />
          </p>

          {links.length === 0 ? (
            <p className={'text-sm opacity-70'}>
              <Translate k={'shareLink:noLinks'} />
            </p>
          ) : (
            <ul className={'flex list-none flex-col gap-3 p-0'}>
              {links.map((link) => (
                <li
                  className={
                    'flex flex-col gap-2 border-b pb-3 last:border-b-0 [border-color:var(--theme-elevation-150)]'
                  }
                  key={link.id}>
                  <input
                    className={'w-full rounded border p-2 font-mono text-sm'}
                    onFocus={(event) => event.currentTarget.select()}
                    readOnly
                    value={urlOf(link.token)}
                  />
                  <div className={'flex flex-row flex-wrap items-center justify-between gap-2'}>
                    <span className={'text-sm opacity-70'}>
                      {link.expired ? (
                        <Translate k={'shareLink:expiredBadge'} />
                      ) : link.expiresAt ? (
                        <>
                          <Translate k={'shareLink:expiresOn'} />
                          {': '}
                          <DateTime date={link.expiresAt} />
                        </>
                      ) : (
                        <>
                          <Translate k={'shareLink:expiry'} />
                          {': '}
                          <Translate k={'shareLink:expiryUnlimited'} />
                        </>
                      )}
                    </span>
                    <div className={'flex flex-row items-center gap-2'}>
                      <Button
                        buttonStyle={'secondary'}
                        disabled={link.expired || !origin}
                        margin={false}
                        onClick={() => handleCopy(link.token)}
                        size={'small'}>
                        <Translate k={'shareLink:copy'} />
                      </Button>
                      <Button
                        buttonStyle={'error'}
                        disabled={busy}
                        margin={false}
                        onClick={() => handleDelete(link.id)}
                        size={'small'}>
                        <Translate k={'shareLink:deleteLink'} />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <label className={'flex flex-col gap-1'}>
            <span className={'text-sm'}>
              <Translate k={'shareLink:expiry'} />
            </span>
            <select
              className={'w-full rounded border p-2 text-sm'}
              onChange={(event) => setMonths(event.currentTarget.value)}
              value={months}>
              <option value={UNLIMITED}>{t('shareLink:expiryUnlimited')}</option>
              {EXPIRY_MONTH_OPTIONS.map((count) => (
                <option key={count} value={String(count)}>
                  {t('shareLink:expiryMonths', { count })}
                </option>
              ))}
            </select>
          </label>

          <div aria-live={'polite'} className={'min-h-6 text-sm'} role={'status'}>
            {busy && !message && <Translate k={'shareLink:working'} />}
            {message && <Translate k={MESSAGE_KEYS[message]} />}
          </div>

          <div className={'flex flex-row items-center gap-2'}>
            <Button
              buttonStyle={'primary'}
              disabled={busy}
              margin={false}
              onClick={handleCreate}
              size={'small'}>
              <Translate k={'shareLink:createLink'} />
            </Button>
            <Button
              buttonStyle={'secondary'}
              margin={false}
              onClick={() => closeModal(drawerSlug)}
              size={'small'}>
              <Translate k={'shareLink:close'} />
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
