import { DefaultTemplate } from '@payloadcms/next/templates'
import { toNumber } from 'es-toolkit/compat'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { AdminViewServerProps } from 'payload'
import React from 'react'

import { LastUpdated } from '@/components/last-updated'
import { StepNav } from '@/components/step-nav'
import { ActivityEditLink } from '@/components/views/activity/overview/activity/activity-edit-link'
import { TasksGrid } from '@/components/views/activity/view/tasks-grid'
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payload-lexical-react-renderer'
import { getDefaultLocaleCode, toContentLocale } from '@/lib/locale-utils'
import { logger } from '@/lib/logger'
import { requireAuthenticatedUser } from '@/lib/require-authenticated-user'

import './landscape-bg.css'
import { Translate } from '@/lib/translate'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

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

  const activityWhere = {
    and: [
      {
        id: { equals: activityid },
        organisation: {
          equals: selectedOrganisationId,
        },
      },
    ],
  }

  const activity = await req.payload
    .find({
      collection: 'activities',
      depth: 2,
      locale,
      where: activityWhere,
      //   TODO: Implement doc order sorting
    })
    .then((res) => {
      if (res.docs.length === 0) {
        return null
      }
      if (res.docs.length > 1) {
        logger.warn('admin/views/activity/view/index: More than one activity found')
      }
      return res?.docs[0]
    })

  const blocks = activity?.blocks ?? []

  // Payload stores a separate block row per locale, and each row has its own id. A language switch
  // therefore leaves the URL with an id that the current locale does not hold. Resolve the block by
  // its position in the locale that owns the id.
  const resolveBlockByPosition = async () => {
    const blocksPerLocale = await req.payload
      .find({
        collection: 'activities',
        depth: 0,
        locale: 'all',
        where: activityWhere,
      })
      .then(
        (res) =>
          res.docs[0]?.blocks as unknown as Record<string, { id?: null | string }[]> | undefined,
      )

    for (const localeBlocks of Object.values(blocksPerLocale ?? {})) {
      const index = localeBlocks.findIndex((block) => block.id === activityBlockId)
      if (index !== -1) {
        return blocks[index]
      }
    }

    return undefined
  }

  const activityBlock =
    blocks.find((block) => block.id === activityBlockId) ??
    (activity ? await resolveBlockByPosition() : undefined)

  const findTitle = (a: typeof activity, block: typeof activityBlock) => {
    if (block?.graph?.task?.text) {
      return block.graph.task.text
    }
    return a?.name
  }

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
          activity={{ blockId: activityBlockId, id: activityid, title: activity?.name }}
          activityBlock={{
            id: activityBlockId,
            title: activityBlock?.graph?.task?.text,
          }}
        />
        <div className={'prose lg:prose-lg'}>
          <h1>{findTitle(activity, activityBlock)}</h1>
          <h3>
            <Translate k={'activityBlock:title'} />
          </h3>
        </div>
        <LastUpdated date={activity?.updatedAt} />
        <ActivityEditLink id={activityid} locale={localeCode} />
        <div className={'mt-8 grid grid-cols-[28%_auto_28%]'}>
          {activityBlock ? (
            <>
              <div className={'grid grid-cols-[auto_48px]'}>
                <div className={'landscape-bg prose prose-lg pb-4 pl-4 pr-4 pt-2'}>
                  <h3>
                    <Translate k={'activityBlock:input:title'} />
                  </h3>
                  {activityBlock.io?.input ? (
                    <PayloadLexicalReactRenderer content={activityBlock.io.input} />
                  ) : (
                    <p>
                      <Translate k={'common:noContentDefined'} />
                    </p>
                  )}
                </div>
                <div className={'landscape-bg-arrow-right'}></div>
              </div>
              <div className={'grid grid-cols-[auto_48px]'}>
                <div className={'landscape-bg relative p-4'}>
                  <div className={'prose prose-lg flex flex-col gap-16'}>
                    {/* `grid-auto-rows: 1fr` gives every row the height of the tallest card, so
                        all cards match across rows. A flex wrap equalises within one row only. */}
                    <div
                      className={
                        'grid grid-cols-[repeat(auto-fill,12rem)] gap-4 leading-[normal] [grid-auto-rows:1fr]'
                      }>
                      <TasksGrid tasks={activityBlock?.relations?.tasks} />
                    </div>
                  </div>
                </div>
                <div className={'landscape-bg-arrow-right'}></div>
              </div>
              <div className={'landscape-bg relative pb-4 pl-4 pr-4 pt-2'}>
                <div className={'prose prose-lg'}>
                  <h3>
                    <Translate k={'activityBlock:output:title'} />
                  </h3>
                  {activityBlock.io?.input ? (
                    <PayloadLexicalReactRenderer content={activityBlock.io.output} />
                  ) : (
                    <p>
                      <Translate k={'common:noContentDefined'} />
                    </p>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div>
              <Translate k={'common:noContentDefined'} />
            </div>
          )}
        </div>
        <div className={'mt-16 grid grid-cols-2 gap-8'}>
          <div className={'prose prose-lg'}>
            <h3>
              <Translate k={'activityBlock:infos:norms'} />
            </h3>
            {activityBlock?.infos?.norms ? (
              <PayloadLexicalReactRenderer content={activityBlock.infos?.norms} />
            ) : (
              <p>
                <Translate k={'common:noContentDefined'} />
              </p>
            )}
          </div>
          <div className={'prose prose-lg'}>
            <h3>
              <Translate k={'activityBlock:infos:support'} />
            </h3>
            {activityBlock?.infos?.support ? (
              <PayloadLexicalReactRenderer content={activityBlock.infos?.support} />
            ) : (
              <p>
                <Translate k={'common:noContentDefined'} />
              </p>
            )}
          </div>
        </div>
      </div>
    </DefaultTemplate>
  )
}
