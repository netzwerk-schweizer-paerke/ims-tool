import { DefaultTemplate } from '@payloadcms/next/templates'
import { headers as getHeaders } from 'next/headers'
import Link from 'next/link'
import { AdminViewServerProps } from 'payload'
import React from 'react'

import { StepNav } from '@/components/step-nav'
import { ViewToolbar } from '@/components/view-toolbar'
import { OverviewContent } from '@/components/views/activity/overview/overview-content'
import { ADMIN_VIEW_LINKS } from '@/components/views/view-links'
import { getDefaultLocaleCode, toContentLocale } from '@/lib/locale-utils'
import { requireAuthenticatedUser } from '@/lib/require-authenticated-user'
import { ShareTarget } from '@/lib/share-link-target'
import { Translate } from '@/lib/translate'
import { findOwnShareLink } from '@/payload/utilities/find-own-share-link'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { loadLandscape } from '@/payload/utilities/share/load-landscape'

export const ActivitiesView: React.FC<AdminViewServerProps> = async ({
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

  // A null id queries `organisation IS NULL` and returns the rows that belong to no
  // organisation. The user has selected none, so the view has nothing to show.
  const landscape = selectedOrganisationId
    ? await loadLandscape({
        locale,
        organisationId: selectedOrganisationId,
        payload: req.payload,
      })
    : { standardActivities: [], strategicActivities: [], supportActivities: [] }

  const shareTarget: ShareTarget = { targetType: 'activityLandscape' }
  const existingShareLink =
    user && selectedOrganisationId
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
      <StepNav home={true} />
      <div
        style={{
          marginTop: 'calc(var(--base) * 2)',
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}>
        <OverviewContent
          emptyAction={
            <Link href={'/admin/collections/activities/create'}>
              <Translate k={'common:continue'} />
            </Link>
          }
          landscape={landscape}
          links={ADMIN_VIEW_LINKS}
          locale={localeCode}
          toolbar={
            selectedOrganisationId ? (
              <ViewToolbar
                editHref={'/admin/collections/activities'}
                existingLink={existingShareLink}
                locale={localeCode}
                target={shareTarget}
              />
            ) : undefined
          }
        />
      </div>
    </DefaultTemplate>
  )
}
