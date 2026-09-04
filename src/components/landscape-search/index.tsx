'use client'

import { useTranslation } from '@payloadcms/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { KeyboardEvent, FocusEvent as ReactFocusEvent, useCallback, useMemo, useState } from 'react'

import { ViewLinks } from '@/components/views/view-links'
import { matchParkIndex } from '@/lib/search/match-park-index'
import { ParkSearchHit, ParkSearchKind, ParkSearchTarget } from '@/lib/search/types'
import { Translate } from '@/lib/translate'
import { I18nKeys, I18nObject } from '@/lib/use-translation-custom-types'

type LoadState = 'error' | 'idle' | 'loading' | 'ready'

type Props = {
  links: ViewLinks
  /** The content locale the page renders. A block id belongs to one locale. */
  locale: string
}

/** An activity and a document have no read-only view, so both open the admin editor. */
const ADMIN_KINDS = new Set<ParkSearchKind>(['activity', 'document'])

/** The most rows the list draws. The footer still reports every match. */
const MAX_ROWS = 50

/** One landscape carries one search, so a fixed id is enough to wire the ARIA relationship. */
const LIST_ID = 'landscape-search-results'

/** The i18n parser cannot extract a computed key, so every kind names its key here. */
const KIND_KEYS: Record<ParkSearchKind, I18nKeys> = {
  activity: 'landscapeSearch:kindActivity',
  block: 'landscapeSearch:kindBlock',
  document: 'landscapeSearch:kindDocument',
  flow: 'landscapeSearch:kindFlow',
  list: 'landscapeSearch:kindList',
  listItem: 'landscapeSearch:kindListItem',
}

const hrefOf = (target: ParkSearchTarget, links: ViewLinks): string => {
  switch (target.kind) {
    case 'activity': {
      return `/admin/collections/activities/${target.activityId}`
    }
    case 'block': {
      return `${links.basePath}/activity/${target.activityId}/block/${target.blockId}`
    }
    case 'document': {
      return `/admin/collections/documents/${target.documentId}`
    }
    case 'flow': {
      return `${links.basePath}/flow/${target.flowId}`
    }
    case 'list':
    case 'listItem': {
      return `${links.basePath}/list/${target.listId}`
    }
  }
}

/** Payload ships no magnifier in its icon set, so the component draws one. */
const SearchIcon = () => (
  <svg
    aria-hidden={true}
    className={'shrink-0'}
    fill={'none'}
    height={13}
    stroke={'currentColor'}
    strokeWidth={2}
    viewBox={'0 0 24 24'}
    width={13}>
    <circle cx={11} cy={11} r={7} />
    <line strokeLinecap={'round'} x1={16.5} x2={21} y1={16.5} y2={21} />
  </svg>
)

const isParkSearchIndex = (value: unknown): value is { hits: ParkSearchHit[] } =>
  typeof value === 'object' && value !== null && 'hits' in value && Array.isArray(value.hits)

/**
 * The keyword search of one park. It expands on focus, and it loads its index once.
 *
 * The whole park is a few hundred records, so the filter runs in the browser. A request per
 * keystroke would re-read every record instead.
 */
export const LandscapeSearch = ({ links, locale }: Props) => {
  const { t } = useTranslation<I18nObject, I18nKeys>()
  const router = useRouter()

  const [active, setActive] = useState(0)
  const [hits, setHits] = useState<ParkSearchHit[]>([])
  /** The locale the loaded index belongs to. A locale switch must not keep the old one. */
  const [indexLocale, setIndexLocale] = useState<null | string>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [state, setState] = useState<LoadState>('idle')

  const visible = useMemo(
    () => (links.showEdit ? hits : hits.filter((hit) => !ADMIN_KINDS.has(hit.target.kind))),
    [hits, links.showEdit],
  )

  /** The index of another locale must never be searched, or a hit carries a foreign block id. */
  const ready = state === 'ready' && indexLocale === locale

  const results = useMemo(
    () => (ready ? matchParkIndex(visible, query) : []),
    [query, ready, visible],
  )

  /** The list shows a bounded number of rows, and the footer reports the true total. */
  const rows = useMemo(() => results.slice(0, MAX_ROWS), [results])

  const load = useCallback(async () => {
    // A locale switch keeps this component mounted, so a ready index for another locale
    // must load again. Otherwise every block id belongs to the locale the user left.
    if (state === 'loading' || (state === 'ready' && indexLocale === locale)) {
      return
    }

    setState('loading')

    try {
      // The locale must travel with the request, or the endpoint reads the default one.
      // The credentials must travel too, or the access filter matches no row.
      const params = new URLSearchParams({ locale })
      const response = await fetch(`/api/park-search?${params.toString()}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`the search answered ${response.status}`)
      }

      const body: unknown = await response.json()

      if (!isParkSearchIndex(body)) {
        throw new Error('the search returned no hits array')
      }

      setHits(body.hits)
      setIndexLocale(locale)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [indexLocale, locale, state])

  const handleFocus = useCallback(() => {
    setOpen(true)
    void load()
  }, [load])

  const handleBlur = useCallback((event: ReactFocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false)
    }
  }, [])

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Escape') {
        setQuery('')
        setOpen(false)
        event.currentTarget.blur()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        // An empty list must leave the index at 0, or `Enter` selects nothing once it fills.
        setActive((index) => Math.max(0, Math.min(index + 1, rows.length - 1)))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((index) => Math.max(index - 1, 0))
        return
      }

      if (event.key === 'Enter' && rows[active]) {
        event.preventDefault()
        router.push(hrefOf(rows[active].target, links))
        setOpen(false)
      }
    },
    [active, links, rows, router],
  )

  const showList = open && query.trim().length > 0

  return (
    <div className={'relative'} onBlur={handleBlur}>
      {/* The metrics copy Payload's small secondary button, so the row reads as one toolbar. */}
      <div
        className={
          'flex flex-row items-center gap-2 rounded-[3px] border px-2 ' +
          '[border-color:var(--theme-elevation-800)]'
        }>
        <SearchIcon />
        <input
          aria-activedescendant={rows[active] ? `${LIST_ID}-${active}` : undefined}
          aria-controls={LIST_ID}
          aria-expanded={showList}
          aria-label={t('landscapeSearch:open')}
          className={
            'w-40 border-0 bg-transparent p-0 text-[13px] leading-[22px] outline-none ' +
            'transition-[width] duration-200 focus:w-72 [color:var(--theme-text)] ' +
            '[&::-webkit-search-cancel-button]:appearance-none'
          }
          onChange={(event) => {
            setQuery(event.currentTarget.value)
            setActive(0)
          }}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={t('landscapeSearch:placeholder')}
          role={'combobox'}
          type={'search'}
          value={query}
        />
      </div>
      {showList && (
        <div
          className={
            'absolute left-0 z-50 mt-1 max-h-96 w-96 overflow-y-auto rounded border shadow-lg ' +
            '[background-color:var(--theme-elevation-0)] [border-color:var(--theme-border-color)]'
          }
          id={LIST_ID}
          role={'listbox'}>
          {!ready && state !== 'error' && (
            <p className={'p-3 text-sm opacity-70'}>
              <Translate k={'landscapeSearch:loading'} />
            </p>
          )}
          {state === 'error' && (
            <p className={'p-3 text-sm opacity-70'}>
              <Translate k={'landscapeSearch:error'} />
            </p>
          )}
          {ready && rows.length === 0 && (
            <p className={'p-3 text-sm opacity-70'}>
              {t('landscapeSearch:noResults', { query })}
            </p>
          )}
          {rows.map((hit, index) => (
            <Link
              aria-selected={index === active}
              className={`block border-b px-3 py-2 text-sm no-underline last:border-b-0 ${
                index === active ? '[background-color:var(--theme-elevation-100)]' : ''
              }`}
              href={hrefOf(hit.target, links)}
              id={`${LIST_ID}-${index}`}
              key={`${hit.target.kind}-${index}`}
              onClick={() => setOpen(false)}
              onMouseEnter={() => setActive(index)}
              role={'option'}
              style={{ borderColor: 'var(--theme-border-color)' }}>
              {/* A list item takes its title from a rich text field, which runs long. */}
              <span className={'block truncate font-medium'}>
                {hit.title || <Translate k={'activityLandscape:blockHasNoName'} />}
              </span>
              <span className={'block truncate text-xs opacity-60'}>
                {t(KIND_KEYS[hit.target.kind])}
                {hit.context && ` · ${hit.context}`}
              </span>
            </Link>
          ))}
          {ready && results.length > 0 && (
            <p className={'px-3 py-2 text-xs opacity-60'}>
              {/* The count names every match, while the list above stops at MAX_ROWS. */}
              {t('landscapeSearch:resultCount', { count: results.length })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
