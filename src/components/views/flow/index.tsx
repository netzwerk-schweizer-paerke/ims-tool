import { DefaultTemplate } from '@payloadcms/next/templates'
import { toNumber } from 'es-toolkit/compat'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { AdminViewServerProps } from 'payload'
import React from 'react'

import { StepNav } from '@/components/step-nav'
import { ViewToolbar } from '@/components/view-toolbar'
import { FlowContent } from '@/components/views/flow/flow-content'
import { getDefaultLocaleCode, toContentLocale } from '@/lib/locale-utils'
import { logger } from '@/lib/logger'
import { requireAuthenticatedUser } from '@/lib/require-authenticated-user'
import { ShareTarget } from '@/lib/share-link-target'
import { findOwnShareLink } from '@/payload/utilities/find-own-share-link'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { loadFlow } from '@/payload/utilities/share/load-flow'

export const FlowBlockView: React.FC<AdminViewServerProps> = async ({
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

  const flowId = toNumber(params?.segments?.[1])

  if (!selectedOrganisationId || !flowId) {
    // The user has no organisation selected, or the URL carries no numeric flow id.
    // Neither one can resolve a record, so render the admin 404 rather than an error page.
    logger.warn(
      `admin/views/flow/index: cannot resolve a flow. organisation=${selectedOrganisationId}, flow=${flowId}`,
    )
    notFound()
  }

  const loaded = await loadFlow({
    flowId,
    locale,
    organisationId: selectedOrganisationId,
    payload: req.payload,
  })

  if (!loaded) {
    // Stale link, or a flow belonging to another organisation — render the admin 404
    // rather than an error page
    notFound()
  }

  const { activity, flowBlock } = loaded

  const shareTarget: ShareTarget = { targetType: 'flow', taskFlow: flowId }
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
        {activity && (
          <StepNav
            activity={{ blockId: activity.blockId, id: activity.id, title: activity.name }}
            activityBlock={{ id: activity.blockId, title: activity.blockTitle }}
            flowBlock={{ id: flowId, title: flowBlock.name }}
          />
        )}
        <FlowContent
          flowBlock={flowBlock}
          toolbar={
            <ViewToolbar
              editHref={`/admin/collections/task-flows/${flowId}?locale=${localeCode}`}
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
