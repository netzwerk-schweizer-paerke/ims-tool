'use client'

import { Button, Drawer, useDrawerSlug, useModal, useTranslation } from '@payloadcms/ui'
import { useCallback, useEffect, useRef, useState } from 'react'

import { buildShareUrl, ShareTarget } from '@/lib/share-link-target'
import { Translate } from '@/lib/translate'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

const MESSAGE_MS = 3000

type Message = 'copied' | 'deleted' | 'error'

const MESSAGE_KEYS: Record<Message, I18nKeys> = {
  copied: 'shareLink:copied',
  deleted: 'shareLink:deleted',
  error: 'shareLink:error',
}

export type ShareLinkRef = {
  id: number
  token: string
}

type Props = {
  editHref: string
  /** The link this user already created for this page, resolved on the server. */
  existingLink: null | ShareLinkRef
  locale: string
  target: ShareTarget
}

const isShareLinkRef = (value: unknown): value is ShareLinkRef =>
  typeof value === 'object' &&
  value !== null &&
  'id' in value &&
  typeof value.id === 'number' &&
  'token' in value &&
  typeof value.token === 'string'

const warn = (message: string) => {
  // A client component must not import the tslog logger, which would reach the browser bundle.
  if (process.env.NODE_ENV === 'development') {
    console.warn(`view-toolbar: ${message}`)
  }
}

/**
 * The edit and share actions of a read-only view. It sits on the row of the last-updated line,
 * on the outer right. The share action opens a dialog that states the scope and shows the URL.
 */
export const ViewToolbar = ({ editHref, existingLink, locale, target }: Props) => {
  const drawerSlug = useDrawerSlug('share-link')
  const { closeModal, openModal } = useModal()
  const { t } = useTranslation<I18nObject, I18nKeys>()

  const [link, setLink] = useState<null | ShareLinkRef>(existingLink)
  const [url, setUrl] = useState<null | string>(null)
  const [message, setMessage] = useState<Message | null>(null)
  const [busy, setBusy] = useState(false)
  const timeout = useRef<null | ReturnType<typeof setTimeout>>(null)

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

  const createLink = useCallback(async (): Promise<ShareLinkRef> => {
    const response = await fetch('/api/share-links', {
      body: JSON.stringify({ ...target, locale }),
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

    return doc
  }, [locale, target])

  /** The dialog mints the link on open, so the preview always shows a real URL. */
  const handleOpen = useCallback(async () => {
    openModal(drawerSlug)
    setMessage(null)

    if (busy) {
      return
    }
    setBusy(true)

    try {
      const current = link ?? (await createLink())
      setLink(current)
      setUrl(buildShareUrl({ locale, origin: window.location.origin, token: current.token }))
    } catch (error) {
      warn(error instanceof Error ? error.message : 'the create failed')
      showMessage('error')
    } finally {
      setBusy(false)
    }
  }, [busy, createLink, drawerSlug, link, locale, openModal, showMessage])

  const handleCopy = useCallback(async () => {
    if (!url) {
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      showMessage('copied')
    } catch (error) {
      warn(error instanceof Error ? error.message : 'the copy failed')
      showMessage('error')
    }
  }, [showMessage, url])

  const handleDelete = useCallback(async () => {
    if (busy || !link) {
      return
    }
    setBusy(true)

    try {
      const response = await fetch(`/api/share-links/${link.id}`, {
        credentials: 'include',
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`the delete answered ${response.status}`)
      }

      setLink(null)
      setUrl(null)
      showMessage('deleted')
      closeModal(drawerSlug)
    } catch (error) {
      warn(error instanceof Error ? error.message : 'the delete failed')
      showMessage('error')
    } finally {
      setBusy(false)
    }
  }, [busy, closeModal, drawerSlug, link, showMessage])

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
        tooltip={link ? t('shareLink:isShared') : undefined}>
        {link && (
          <span
            aria-hidden={true}
            className={'mr-2 inline-block h-2 w-2 rounded-full align-middle'}
            style={{ background: 'var(--theme-success-500, #22c55e)' }}
          />
        )}
        {/* Two static keys, because the i18n parser cannot extract a computed one. */}
        {link ? <Translate k={'shareLink:shared'} /> : <Translate k={'shareLink:share'} />}
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
          <label className={'flex flex-col gap-1'}>
            <span className={'text-sm'}>
              <Translate k={'shareLink:urlLabel'} />
            </span>
            <input
              className={'w-full rounded border p-2 font-mono text-sm'}
              onFocus={(event) => event.currentTarget.select()}
              readOnly
              value={url ?? ''}
            />
          </label>
          <div aria-live={'polite'} className={'min-h-6 text-sm'} role={'status'}>
            {busy && !message && <Translate k={'shareLink:working'} />}
            {message && <Translate k={MESSAGE_KEYS[message]} />}
          </div>
          <div className={'flex flex-row items-center gap-2'}>
            <Button
              buttonStyle={'primary'}
              disabled={!url}
              margin={false}
              onClick={handleCopy}
              size={'small'}>
              <Translate k={'shareLink:copy'} />
            </Button>
            {link && (
              <Button
                buttonStyle={'error'}
                disabled={busy}
                margin={false}
                onClick={handleDelete}
                size={'small'}>
                <Translate k={'shareLink:deleteLink'} />
              </Button>
            )}
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
