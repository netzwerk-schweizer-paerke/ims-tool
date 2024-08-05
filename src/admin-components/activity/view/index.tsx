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
import { ListsGrid } from '@/admin-components/activity/view/lists-grid';
import { ActivityEditLink } from '@/admin-components/activity/overview/activity/activity-edit-link';
import { LandscapeSvgBgArrow } from '@/admin-components/activity/overview/activity/lib/landscape-svg-bg-arrow';

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
        <ActivityEditLink id={activityid} locale={locale} />
        <div className={'mt-8 grid grid-cols-[22%_auto_22%]'}>
          {activityBlock ? (
            <>
              <div className={'grid grid-cols-[auto_64px]'}>
                <div className={'prose prose-lg bg-[var(--theme-text-33)] p-4'}>
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
                <div className={'relative h-full'}>
                  <div className={'absolute inset-0'}>
                    <LandscapeSvgBgArrow opacity={0.33} />
                  </div>
                </div>
              </div>
              <div className={'grid grid-cols-[auto_64px]'}>
                <div className={'relative bg-[var(--theme-text-33)] p-4'}>
                  <div className={'prose prose-lg flex flex-col gap-16'}>
                    <FlowsGrid
                      activityId={activityid}
                      flows={activityBlock?.relations?.flowRelation}
                    />
                    <ListsGrid
                      activityId={activityid}
                      lists={activityBlock?.relations?.listRelation}
                    />
                  </div>
                </div>
                <div className={'relative h-full'}>
                  <div className={'absolute inset-0'}>
                    <LandscapeSvgBgArrow opacity={0.33} />
                  </div>
                </div>
              </div>
              <div className={'relative bg-[var(--theme-text-33)] p-4'}>
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
