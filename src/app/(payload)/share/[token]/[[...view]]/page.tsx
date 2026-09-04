import type { Metadata } from 'next'

import config from '@payload-config'
import { toNumber } from 'es-toolkit/compat'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { OverviewContent } from '@/components/views/activity/overview/overview-content'
import { ActivityBlockContent } from '@/components/views/activity/view/activity-block-content'
import { FlowContent } from '@/components/views/flow/flow-content'
import { ListContent } from '@/components/views/list/list-content'
import { ShareShell } from '@/components/views/share-shell'
import { shareViewLinks } from '@/components/views/view-links'
import { getDefaultLocaleCode, toContentLocale } from '@/lib/locale-utils'
import { ShareTarget, shareTargetFromLink, StoredShareLink } from '@/lib/share-link-target'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { loadActivityBlock } from '@/payload/utilities/share/load-activity-block'
import { loadFlow } from '@/payload/utilities/share/load-flow'
import { loadLandscape } from '@/payload/utilities/share/load-landscape'
import { loadList } from '@/payload/utilities/share/load-list'

// A share link reaches people by mail and by chat. It must never reach a search index.
export const metadata: Metadata = {
  robots: { follow: false, index: false },
}

type Args = {
  params: Promise<{ token: string; view?: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

/**
 * The page the visitor asked for, or null.
 *
 * A landscape link covers the whole park, so its visitor may open any page of it. A link to one
 * page covers that page alone, and a deeper path under it resolves to nothing.
 */
const resolveRequestedTarget = (
  link: StoredShareLink,
  view: string[],
): null | ShareTarget => {
  const granted = shareTargetFromLink(link)

  if (!granted) {
    return null
  }

  if (view.length === 0) {
    return granted
  }

  if (granted.targetType !== 'activityLandscape') {
    return null
  }

  if (view.length === 2 && view[0] === 'flow') {
    const taskFlow = toNumber(view[1])
    return taskFlow ? { targetType: 'flow', taskFlow } : null
  }

  if (view.length === 2 && view[0] === 'list') {
    const taskList = toNumber(view[1])
    return taskList ? { targetType: 'list', taskList } : null
  }

  if (view.length === 4 && view[0] === 'activity' && view[2] === 'block') {
    const activity = toNumber(view[1])
    return activity && view[3]
      ? { activity, blockId: view[3], targetType: 'activityBlock' }
      : null
  }

  return null
}

/**
 * The public read-only page behind a share link. It renders inside the `(payload)` route group,
 * so it inherits the admin providers. See the decision page
 * `public-page-lives-in-the-payload-route-group`.
 */
const SharePage = async ({ params, searchParams }: Args) => {
  const { token, view } = await params
  const query = await searchParams

  if (!token) {
    notFound()
  }

  const payload = await getPayload({ config })

  // The visitor holds a token and no session, so the read overrides access. The token is the
  // only credential, and it never reaches a log line.
  const link = await payload
    .find({
      collection: 'share-links',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { token: { equals: token } },
    })
    .then((res) => res.docs[0] ?? null)

  if (!link) {
    notFound()
  }

  const organisationId = getIdFromRelation(link.organisation)
  const target = resolveRequestedTarget(link, view ?? [])

  if (organisationId === null || !target) {
    notFound()
  }

  const requested = Array.isArray(query.locale) ? link.locale : (query.locale ?? link.locale)
  const locale = toContentLocale(requested, payload.config)
  const localeCode = locale ?? getDefaultLocaleCode(payload.config)

  const organisation = await payload
    .find({
      collection: 'organisations',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: { id: { equals: organisationId } },
    })
    .then((res) => res.docs[0] ?? null)

  const links = shareViewLinks(token)
  const loaderArgs = { locale, organisationId, payload }
  // A visitor who followed a link inside the park needs the way back to the entry page.
  const backHref = view && view.length > 0 ? `${links.basePath}?locale=${localeCode}` : undefined

  const shell = (children: React.ReactNode) => (
    <ShareShell backHref={backHref} organisationName={organisation?.name}>
      {children}
    </ShareShell>
  )

  if (target.targetType === 'activityLandscape') {
    const landscape = await loadLandscape(loaderArgs)

    return shell(<OverviewContent landscape={landscape} links={links} locale={localeCode} />)
  }

  if (target.targetType === 'flow') {
    const loaded = await loadFlow({ ...loaderArgs, flowId: target.taskFlow })

    if (!loaded) {
      notFound()
    }

    return shell(<FlowContent flowBlock={loaded.flowBlock} />)
  }

  if (target.targetType === 'list') {
    const loaded = await loadList({ ...loaderArgs, listId: target.taskList })

    if (!loaded) {
      notFound()
    }

    return shell(<ListContent listBlock={loaded.listBlock} />)
  }

  const loaded = await loadActivityBlock({
    ...loaderArgs,
    activityId: target.activity,
    blockId: target.blockId,
  })

  if (!loaded) {
    notFound()
  }

  return shell(
    <ActivityBlockContent
      activity={loaded.activity}
      activityBlock={loaded.activityBlock}
      links={links}
    />,
  )
}

export default SharePage
