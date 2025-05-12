import React from 'react'
import { AdminViewProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { headers as getHeaders } from 'next/headers'
import { getIdFromRelation } from '@/payload/utilities/get-id-from-relation'
import { toNumber } from 'lodash-es'
import { assert } from 'ts-essentials'
import { Translate } from '@/lib/translate'
import { TaskFlow } from '@/payload-types'
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payloadLexicalReactRenderer'
import { StepNav } from '@/components/step-nav'
import { ListEditLink } from '@/components/views/list/list-edit-link'
import { BlockMetaWrapper } from '@/components/views/flow/lib/block-meta-wrapper'
import { LastUpdated } from '@/components/last-updated'

function isTaskFlowArray(listRelation: any): listRelation is TaskFlow[] {
  return Array.isArray(listRelation) && listRelation.every((list) => typeof list.id === 'number')
}

export const ListBlockView: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const headers = await getHeaders()
  const { permissions, req } = initPageResult
  const { user } = await req.payload.auth({ headers })
  const locale = req.locale || req.payload.config.i18n.fallbackLanguage

  const selectedOrganisationId = getIdFromRelation(user?.selectedOrganisation)

  const listId = toNumber(params?.segments?.[1])

  assert(selectedOrganisationId, `Selected Organisation ID not set, ${selectedOrganisationId}`)
  assert(listId, `Flow ID not set, ${listId}`)

  const listBlock = await req.payload
    .find({
      collection: 'task-lists',
      locale: locale as any,
      depth: 2,
      where: {
        and: [
          {
            organisation: {
              equals: selectedOrganisationId,
            },
            id: { equals: listId },
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
        throw new Error('More than one activity found')
      }
      return res?.docs[0]
    })

  if (!listBlock) {
    throw new Error(`Flow block (${listId}) not found`)
  }

  const blocks = listBlock.items || []

  const activity = await req.payload
    .find({
      collection: 'activities',
      locale: locale as any,
      depth: 2,
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
      const activity = res.docs.filter((doc) => {
        // These are activity blocks that contain lists and lists
        const activityBlocks = doc.blocks
        return activityBlocks?.some((block) => {
          const listRelation = block.relations?.tasks
            ?.filter((task) => task.relationTo === 'task-lists')
            .map((task) => task.value)
          if (isTaskFlowArray(listRelation) && listRelation.some((list) => list.id === listId)) {
            blockId = block.id as string
            return true
          }
          return false
        })
      })
      if (activity.length === 0) {
        throw new Error('No activities found')
      }
      if (activity.length > 1) {
        throw new Error('More than one activity found')
      }
      return {
        id: activity[0].id,
        blockId: blockId,
        name: activity[0].name,
      }
    })

  return (
    <DefaultTemplate
      i18n={req.i18n}
      payload={req.payload}
      visibleEntities={initPageResult.visibleEntities}>
      <div
        style={{
          marginTop: 'calc(var(--base) * 2)',
          paddingLeft: 'var(--gutter-h)',
          paddingRight: 'var(--gutter-h)',
        }}>
        <StepNav
          activity={{ id: activity.id, title: activity.name, blockId: activity.blockId }}
          listBlock={{ id: listId, title: listBlock.name }}
        />
        <div className={'prose prose-lg'}>
          <h1>{listBlock.name}</h1>
          <h3>
            <Translate k={'listBlock:title'} />
          </h3>
          <LastUpdated date={listBlock?.updatedAt} />
          <ListEditLink id={listBlock.id} locale={locale} />
        </div>
        <div className={'mt-8'}>
          <div className={'grid grid-cols-3'}>
            <div className={'pl-4'}>
              <Translate k={'listBlock:table:keypoints'} />
            </div>
            <div className={'pl-4'}>
              <Translate k={'listBlock:table:tools'} />
            </div>
            <div className={'pl-4'}>
              <Translate k={'listBlock:table:responsibility'} />
            </div>
            {blocks.map((block, i) => (
              <React.Fragment key={i}>
                <BlockMetaWrapper>
                  <PayloadLexicalReactRenderer content={block.topic as any} />
                </BlockMetaWrapper>
                <BlockMetaWrapper>
                  <PayloadLexicalReactRenderer content={block.tools as any} />
                </BlockMetaWrapper>
                <BlockMetaWrapper>
                  <PayloadLexicalReactRenderer content={block.responsibility as any} />
                </BlockMetaWrapper>
              </React.Fragment>
            ))}
          </div>
          {blocks.length === 0 && (
            <p>
              <Translate k={'common:noContentDefined'} />
            </p>
          )}
        </div>
        {listBlock.description && (
          <div className={'mt-8'}>
            <div className={'prose prose-lg py-6 pl-4'}>
              <PayloadLexicalReactRenderer content={listBlock.description as any} />
            </div>
          </div>
        )}
      </div>
    </DefaultTemplate>
  )
}
