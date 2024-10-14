import React from 'react';
import { AdminViewProps } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { headers as getHeaders } from 'next/headers';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { toNumber } from 'lodash-es';
import { assert } from 'ts-essentials';
import { FlowBlock } from '@/admin/views/flow/flow-block';
import { FlowEditLink } from '@/admin/views/flow/flow-edit-link';
import { Translate } from '@/lib/translate';
import { TaskFlow } from '@/types/payload-types';
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payloadLexicalReactRenderer';
import { StepNav } from '@/admin/components/step-nav';
import { logger } from '@/lib/logger';
import { LastUpdated } from '@/admin/components/last-updated';

function isTaskFlowArray(flowRelation: any): flowRelation is TaskFlow[] {
  return Array.isArray(flowRelation) && flowRelation.every((flow) => typeof flow.id === 'number');
}

export const FlowBlockView: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const headers = await getHeaders();
  const { permissions, req } = initPageResult;
  const { user } = await req.payload.auth({ headers });
  const locale = req.locale || req.payload.config.i18n.fallbackLanguage;

  const selectedOrganisationId = getIdFromRelation(user?.selectedOrganisation);

  const flowId = toNumber(params?.segments?.[1]);

  assert(selectedOrganisationId, `Selected Organisation ID not set, ${selectedOrganisationId}`);
  assert(flowId, `Flow ID not set, ${flowId}`);

  const flowBlock = await req.payload
    .find({
      collection: 'task-flows',
      locale: locale as any,
      depth: 2,
      where: {
        and: [
          {
            organisation: {
              equals: selectedOrganisationId,
            },
            id: { equals: flowId },
          },
        ],
      },
      //   TODO: Implement doc order sorting
    })
    .then((res) => {
      if (res.docs.length === 0) {
        return null;
      }
      if (res.docs.length > 1) {
        logger.warn('admin/views/flow/index: More than one flow block found');
      }
      return res?.docs[0];
    });

  if (!flowBlock) {
    throw new Error(`Flow block (${flowId}) not found`);
  }

  const blocks = flowBlock.blocks || [];

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
      let blockId = '';
      let blockTitle = '';
      const activity = res.docs.filter((doc) => {
        // These are activity blocks that contain flows and lists
        const activityBlocks = doc.blocks;
        return activityBlocks?.some((block) => {
          const flowRelation = block.relations?.flowRelation;
          if (isTaskFlowArray(flowRelation) && flowRelation.some((flow) => flow.id === flowId)) {
            blockId = block.id as string;
            blockTitle = block?.graph?.task?.text as string;
            return true;
          }
          return false;
        });
      });
      if (activity.length === 0) {
        throw new Error('No activities found');
      }
      if (activity.length > 1) {
        logger.warn('admin/views/flow/index: More than one activity found');
      }
      return {
        id: activity[0].id,
        blockId,
        blockTitle,
        name: activity[0].name,
      };
    });

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
          activityBlock={{ id: activity.blockId, title: activity.blockTitle }}
          flowBlock={{ id: flowId, title: flowBlock.name }}
        />
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
              <FlowBlock key={i} block={block} />
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
  );
};
