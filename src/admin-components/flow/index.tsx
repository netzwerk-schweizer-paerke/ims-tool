import React from 'react';
import { AdminViewProps } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { headers as getHeaders } from 'next/headers';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { toNumber } from 'lodash-es';
import { assert } from 'ts-essentials';
import { FlowBlock } from '@/admin-components/flow/flow-block';
import { FlowEditLink } from '@/admin-components/flow/flow-edit-link';
import { Translate } from '@/lib/translate';

export const FlowBlockView: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const headers = getHeaders();
  const { permissions, req } = initPageResult;
  const { user } = await req.payload.auth({ headers });
  const locale = req.locale || req.payload.config.i18n.fallbackLanguage;

  const selectedOrganisationId = getIdFromRelation(user?.selectedOrganisation);

  const activityid = toNumber(params?.segments?.[1]);
  const flowId = toNumber(params?.segments?.[3]);

  assert(selectedOrganisationId, `Selected Organisation ID not set, ${selectedOrganisationId}`);
  assert(activityid, `Activity ID not set, ${activityid}`);
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
      console.log({ res: res.docs[0] });
      if (res.docs.length === 0) {
        return null;
      }
      if (res.docs.length > 1) {
        throw new Error('More than one activity found');
      }
      return res?.docs[0];
    });

  if (!flowBlock) {
    throw new Error(`Flow block (${flowId}) not found`);
  }

  const blocks = flowBlock.blocks || [];

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
        <h1 id="custom-view-title">
          <Translate k={'flowBlock:title'} />
        </h1>
        <div className={'mt-8'}>
          <div className={'prose prose-lg'}>
            <h2>{flowBlock.name}</h2>
            <FlowEditLink id={flowBlock.id} locale={locale} />
          </div>
          <div className={'grid grid-cols-[420px_auto_auto_auto]'}>
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
      </div>
    </DefaultTemplate>
  );
};
