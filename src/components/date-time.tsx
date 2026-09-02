'use client'

import { useEffect, useState } from 'react'

import { useFormattedDate } from '@/hooks/use-formatted-date'

const RELATIVE_REFRESH_MS = 60_000

type Props = {
  date?: null | string
}

/** The exact time. The title carries the viewer's IANA zone, because the line itself cannot. */
export const DateTime = ({ date }: Props) => {
  const { absolute, withZone } = useFormattedDate()
  if (!date) return null

  const text = absolute(date)
  if (!text) return null

  return (
    <time dateTime={date} title={withZone(date) ?? undefined}>
      {text}
    </time>
  )
}

/** The distance from now. It re-renders every minute, so an open tab never shows a stale value. */
export const RelativeTime = ({ date }: Props) => {
  const { relative, withZone } = useFormattedDate()
  const [, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), RELATIVE_REFRESH_MS)
    return () => clearInterval(id)
  }, [])

  if (!date) return null

  const text = relative(date)
  if (!text) return null

  return (
    <time dateTime={date} title={withZone(date) ?? undefined}>
      {text}
    </time>
  )
}
