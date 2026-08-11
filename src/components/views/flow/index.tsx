import { DefaultTemplate } from '@payloadcms/next/templates'
import { toNumber } from 'es-toolkit/compat'
import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { AdminViewServerProps } from 'payload'
import React from 'react'
import { assert } from 'ts-essentials'

import { LastUpdated } from '@/components/last-updated'
import { StepNav } from '@/components/step-nav'
import { FlowBlock } from '@/components/views/flow/flow-block'
import { FlowEditLink } from '@/components/views/flow/flow-edit-link'
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payload-lexical-react-renderer'
import { logger } from '@/lib/logger'
import { Translate } from '@/lib/translate'
import { TaskFlow } from '@/payload-types'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'

function isTaskFlowArray(flowRelation: any): flowRelation is TaskFlow[] {
  return Array.isArray(flowRelation) && flowRelation.every((flow) => typeof flow.id === 'number')
}

export const FlowBlockView: React.FC<AdminViewServerProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const headers = await getHeaders()
  const { req } = initPageResult
  const { user } = await req.payload.auth({ headers })
  const locale = req.locale || req.payload.config.i18n.fallbackLanguage

  const selectedOrganisationId = getIdFromRelation(user?.selectedOrganisation)

  const flowId = toNumber(params?.segments?.[1])

  assert(selectedOrganisationId, `Selected Organisation ID not set, ${selectedOrganisationId}`)
  assert(flowId, `Flow ID not set, ${flowId}`)

  const flowBlock = await req.payload
    .find({
      collection: 'task-flows',
      depth: 2,
      locale: locale as any,
      where: {
        and: [
          {
            id: { equals: flowId },
            organisation: {
              equals: selectedOrganisationId,
            },
          },
        ],
      },
      //   TODO: Implement doc order sorting
    })
    .then((res) => {
      if (res.docs.length === 0) {
        return null
      }
      if (res.docs.length > 1) {
        logger.warn('admin/views/flow/index: More than one flow block found')
      }
      return res?.docs[0]
    })

  if (!flowBlock) {
    // Stale link, or a flow belonging to another organisation — render the admin 404
    // rather than an error page
    notFound()
  }

  const blocks = flowBlock.blocks || []

  const activity = await req.payload
    .find({
      collection: 'activities',
      depth: 2,
      locale: locale as any,
      where: {
        and: [
          {
            organisation: {
              equals: selectedOrganisationId,
            },
          },
        ],
      },
    })
    .then((res) => {
      let blockId = ''
      let blockTitle = ''
      const activity = res.docs.filter((doc) => {
        // These are activity blocks that contain flows and lists
        const activityBlocks = doc.blocks
        return activityBlocks?.some((block) => {
          const flowRelation = block.relations?.tasks
            ?.filter((task) => task.relationTo === 'task-flows')
            .map((task) => task.value)
          if (isTaskFlowArray(flowRelation) && flowRelation.some((flow) => flow.id === flowId)) {
            blockId = block.id as string
            blockTitle = block?.graph?.task?.text as string
            return true
          }
          return false
        })
      })
      if (activity.length === 0) {
        // An orphaned flow — no activity block references it. The flow itself still renders;
        // only the breadcrumb is unavailable.
        logger.warn('admin/views/flow/index: No activity references this flow')
        return null
      }
      if (activity.length > 1) {
        logger.warn('admin/views/flow/index: More than one activity found')
      }
      return {
        blockId,
        blockTitle,
        id: activity[0].id,
        name: activity[0].name,
      }
    })

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
        <div className={'prose prose-lg'}>
          <h1>{flowBlock.name}</h1>
          <h3>
            <Translate k={'flowBlock:title'} />
          </h3>
          <LastUpdated date={flowBlock?.updatedAt} />
          <FlowEditLink id={flowBlock.id} locale={locale} />
        </div>
        <div className={'mt-8'}>
          <div className={'grid grid-cols-[440px_auto_auto_auto]'}>
            <div></div>
            <div className={'pl-4'}>
              <Translate k={'flowBlock:table:keypoints'} />
            </div>
            <div className={'pl-4'}>
              <Translate k={'flowBlock:table:tools'} />
            </div>
            <div className={'pl-4'}>
              <Translate k={'flowBlock:table:responsibility'} />
            </div>
            {blocks.map((block, i) => (
              <FlowBlock block={block} key={i} />
            ))}
          </div>
          {blocks.length === 0 && (
            <p>
              <Translate k={'common:noContentDefined'} />
            </p>
          )}
        </div>
        {flowBlock.description && (
          <div className={'mt-8'}>
            <div className={'prose prose-lg py-6 pl-4'}>
              <PayloadLexicalReactRenderer content={flowBlock.description as any} />
            </div>
          </div>
        )}
      </div>
    </DefaultTemplate>
  )
}
