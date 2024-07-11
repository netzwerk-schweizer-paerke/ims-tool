import React from 'react';
import { AdminViewProps } from 'payload';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { headers as getHeaders } from 'next/headers';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payloadLexicalReactRenderer';
import { FlowsGrid } from '@/admin-components/activity/view/flows-grid';
import { toNumber } from 'lodash-es';
import { assert } from 'ts-essentials';
import { Translate } from '@/lib/translate';

export const ActivityBlockView: React.FC<AdminViewProps> = async ({
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
  const activityBlockId = params?.segments?.[3];

  assert(selectedOrganisationId, `Selected Organisation ID not set, ${selectedOrganisationId}`);
  assert(activityid, `Activity ID not set, ${activityid}`);
  assert(activityBlockId, `Flow ID not set, ${activityBlockId}`);

  const activityBlock = await req.payload
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
            id: { equals: activityid },
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
      return res?.docs[0]?.blocks?.find((block) => block.id === (activityBlockId as any));
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
        <h1 id="custom-view-title">
          <Translate k={'activityBlock:title'} />
        </h1>
        <div className={'mt-8 grid grid-cols-[20%_auto_20%] gap-16'}>
          {activityBlock ? (
            <>
              <div className={'prose prose-lg'}>
                <h3>
                  <Translate k={'activityBlock:input:title'} />
                </h3>
                {activityBlock.io?.input ? (
                  <PayloadLexicalReactRenderer content={activityBlock.io.input as any} />
                ) : (
                  <p>
                    <Translate k={'common:noContentDefined'} />
                  </p>
                )}
              </div>
              <div className={'prose prose-lg'}>
                <FlowsGrid activityId={activityid} flows={activityBlock?.relations?.flowRelation} />
                <h3>
                  <Translate k={'activityBlock:lists:title'} />
                </h3>
                <div>{activityBlock.relations?.listRelation ? null : <p>No lists defined</p>}</div>
              </div>
              <div className={'prose prose-lg'}>
                <h3>
                  <Translate k={'activityBlock:output:title'} />
                </h3>
                {activityBlock.io?.input ? (
                  <PayloadLexicalReactRenderer content={activityBlock.io.output as any} />
                ) : (
                  <p>
                    <Translate k={'common:noContentDefined'} />
                  </p>
                )}
              </div>
            </>
          ) : (
            <div>
              <Translate k={'common:noContentDefined'} />
            </div>
          )}
        </div>
      </div>
    </DefaultTemplate>
  );
};
