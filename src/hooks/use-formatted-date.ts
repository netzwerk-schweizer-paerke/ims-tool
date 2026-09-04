'use client'

import { useConfig, useTranslation } from '@payloadcms/ui'
import { formatDate } from '@payloadcms/ui/shared'
import { formatDistanceToNow } from 'date-fns'

import { ADMIN_DATE_FORMAT } from '@/config/date-format'

/**
 * The single source for every date string in the admin. Read `.claude/rules/project/pitfalls/
 * server-component-tolocale-ignores-admin-language.md` before you format a date another way.
 */
export const useFormattedDate = () => {
  const { config } = useConfig()
  const { i18n, t } = useTranslation()

  // TranslationProvider loads i18n.dateFNS in an effect, so it is undefined on the first render.
  // The server render sees the same undefined value, so the two agree and hydration stays clean.
  const ready = Boolean(i18n.dateFNS)
  const loading = `${t('general:loading')}...`

  const parse = (date: string) => {
    const parsed = new Date(date)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  }

  /** The exact time, in the admin language, using `admin.dateFormat`. */
  const absolute = (date: string): null | string => {
    if (!parse(date)) return null
    // A client with no session gets no admin config, so date-fns would receive no pattern
    // and throw. A public share page is exactly that case.
    const pattern = config?.admin?.dateFormat ?? ADMIN_DATE_FORMAT

    return ready ? formatDate({ date, i18n, pattern }) : loading
  }

  /** The exact time plus the viewer's IANA zone, for a title attribute. */
  const withZone = (date: string): null | string => {
    const exact = absolute(date)
    if (!exact || !ready) return exact
    return `${exact} (${new Intl.DateTimeFormat().resolvedOptions().timeZone})`
  }

  /** The distance from now, in the admin language. date-fns writes the preposition itself. */
  const relative = (date: string): null | string => {
    const parsed = parse(date)
    if (!parsed) return null
    if (!ready) return loading
    // A client clock that runs behind turns a fresh timestamp into "in 3 Minuten". Clamp the
    // future to now, so date-fns reports the smallest past distance instead.
    const clamped = new Date(Math.min(parsed.getTime(), Date.now()))
    return formatDistanceToNow(clamped, { addSuffix: true, locale: i18n.dateFNS })
  }

  return { absolute, ready, relative, withZone }
}
