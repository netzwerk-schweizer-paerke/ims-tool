import React from 'react';
import { DefaultTemplate } from '@payloadcms/next/templates';
import { headers as getHeaders } from 'next/headers';
import { getIdFromRelation } from '@/payload/utilities/getIdFromRelation';
import { PayloadLexicalReactRenderer } from '@/lib/lexical-render/src/payloadLexicalReactRenderer';
import { toNumber } from 'lodash-es';
import { assert } from 'ts-essentials';
import { Translate } from '@/lib/translate';
import { StepNav } from '@/admin/components/step-nav';
import { ActivityEditLink } from '@/admin/views/activity/overview/activity/activity-edit-link';
import { FlowsGrid } from '@/admin/views/activity/view/flows-grid';
import { ListsGrid } from '@/admin/views/activity/view/lists-grid';
import './landscape-bg.css';
import { LastUpdated } from '@/admin/components/last-updated';
import { AdminViewProps } from 'payload';

export const ActivityBlockView: React.FC<AdminViewProps> = async ({
  initPageResult,
  params,
  searchParams,
}) => {
  const headers = await getHeaders();
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
      if (res.docs.length === 0) {
        return null;
      }
      if (res.docs.length > 1) {
        throw new Error('More than one activity found');
      }
      return res?.docs[0]?.blocks?.find((block) => block.id === (activityBlockId as any));
    });

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
            id: { equals: activityid },
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
        throw new Error('More than one activity found');
      }
      return res?.docs[0];
    });

  const findTitle = (a: typeof activity, block: typeof activityBlock) => {
    if (block?.graph?.task?.text) {
      return block.graph.task.text;
    }
    return a?.name;
  };

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
          activity={{ id: activityid, title: activity?.name, blockId: activityBlockId }}
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
        <ActivityEditLink id={activityid} locale={locale} />
        <div className={'mt-8 grid grid-cols-[28%_auto_28%]'}>
          {activityBlock ? (
            <>
              <div className={'grid grid-cols-[auto_48px]'}>
                <div className={'landscape-bg prose prose-lg pb-4 pl-4 pt-2'}>
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
                <div className={'landscape-bg-arrow-right'}></div>
              </div>
              <div className={'grid grid-cols-[auto_48px]'}>
                <div className={'landscape-bg relative p-4'}>
                  <div className={'prose prose-lg flex flex-col gap-16'}>
                    <div
                      className={'flex flex-row flex-wrap items-start justify-items-start gap-4'}>
                      <FlowsGrid flows={activityBlock?.relations?.flowRelation} />
                      <ListsGrid lists={activityBlock?.relations?.listRelation} />
                    </div>
                  </div>
                </div>
                <div className={'landscape-bg-arrow-right'}></div>
              </div>
              <div className={'landscape-bg relative pb-4 pl-4 pt-2'}>
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
        <div className={'mt-16 grid grid-cols-2 gap-8'}>
          <div className={'prose prose-lg'}>
            <h3>
              <Translate k={'activityBlock:infos:norms'} />
            </h3>
            {activityBlock?.infos?.norms ? (
              <PayloadLexicalReactRenderer content={activityBlock.infos?.norms as any} />
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
              <PayloadLexicalReactRenderer content={activityBlock.infos?.support as any} />
            ) : (
              <p>
                <Translate k={'common:noContentDefined'} />
              </p>
            )}
          </div>
        </div>
      </div>
    </DefaultTemplate>
  );
};
