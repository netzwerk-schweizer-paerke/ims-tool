import { DefaultTemplate } from '@payloadcms/next/templates'
import { toNumber } from 'es-toolkit/compat'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { AdminViewServerProps } from 'payload'
import React from 'react'

import { StepNav } from '@/components/step-nav'
import { ViewToolbar } from '@/components/view-toolbar'
import { ActivityBlockContent } from '@/components/views/activity/view/activity-block-content'
import { ADMIN_VIEW_LINKS } from '@/components/views/view-links'
import { getDefaultLocaleCode, toContentLocale } from '@/lib/locale-utils'
import { logger } from '@/lib/logger'
import { requireAuthenticatedUser } from '@/lib/require-authenticated-user'
import { ShareTarget } from '@/lib/share-link-target'
import { findOwnShareLink } from '@/payload/utilities/find-own-share-link'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { loadActivityBlock } from '@/payload/utilities/share/load-activity-block'

export const ActivityBlockView: React.FC<AdminViewServerProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const headers = await getHeaders()
  const { req } = initPageResult

  requireAuthenticatedUser({ initPageResult, params, searchParams })

  const { user } = await req.payload.auth({ headers })
  // `i18n.fallbackLanguage` is the admin language, which is a different axis and includes `en`.
  // A query needs the content locale, so narrow it and let Payload default when it is absent.
  const locale = toContentLocale(req.locale, req.payload.config)
  const localeCode = locale ?? getDefaultLocaleCode(req.payload.config)

  const selectedOrganisationId = getIdFromRelation(user?.selectedOrganisation)

  const activityid = toNumber(params?.segments?.[1])
  const activityBlockId = params?.segments?.[3]

  if (!selectedOrganisationId || !activityid || !activityBlockId) {
    // The user has no organisation selected, or the URL carries no activity id and no block id.
    // None of them can resolve a record, so render the admin 404 rather than an error page.
    // The block id is a raw URL segment. Never write it into the log line, because tslog
    // runs in `pretty` mode and a caller could forge a log entry. The request URL holds it.
    logger.warn(
      `admin/views/activity/view: cannot resolve a block. organisation=${selectedOrganisationId}, activity=${activityid}, block=${activityBlockId ? 'present' : 'absent'}`,
    )
    notFound()
  }

  const loaded = await loadActivityBlock({
    activityId: activityid,
    blockId: activityBlockId,
    locale,
    organisationId: selectedOrganisationId,
    payload: req.payload,
  })

  if (!loaded) {
    // Stale link, or an activity belonging to another organisation — render the admin 404
    // rather than an empty page.
    notFound()
  }

  const { activity, activityBlock } = loaded

  const shareTarget: ShareTarget = {
    activity: activityid,
    blockId: activityBlockId,
    targetType: 'activityBlock',
  }
  const existingShareLink = user
    ? await findOwnShareLink({
        organisationId: selectedOrganisationId,
        payload: req.payload,
        target: shareTarget,
        userId: user.id,
      })
    : null

  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}>
      <div
        style={{
          marginTop: 'calc(var(--base) * 2)',
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}>
        <StepNav
          activity={{ blockId: activityBlockId, id: activityid, title: activity.name }}
          activityBlock={{
            id: activityBlockId,
            title: activityBlock?.graph?.task?.text,
          }}
        />
        <ActivityBlockContent
          activity={activity}
          activityBlock={activityBlock}
          links={ADMIN_VIEW_LINKS}
          toolbar={
            <ViewToolbar
              editHref={`/admin/collections/activities/${activityid}?locale=${localeCode}`}
              existingLink={existingShareLink}
              locale={localeCode}
              target={shareTarget}
            />
          }
        />
      </div>
    </DefaultTemplate>
  )
}
