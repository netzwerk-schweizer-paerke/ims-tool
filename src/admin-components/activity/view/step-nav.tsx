'use client';
import { useEffect } from 'react';
import { StepNavItem, useStepNav, useTranslation } from '@payloadcms/ui';
import { I18nKeys, I18nObject } from '@/lib/useTranslation-custom-types';

type Fields = {
  id: number;
  title: string | null | undefined;
};

type Props = {
  home?: boolean;
  activity?: Fields & { blockId: string };
  flowBlock?: Fields;
  listBlock?: Fields;
};

export const StepNav: React.FC<Props> = ({ home = false, activity, flowBlock, listBlock }) => {
  const step = useStepNav();
  const { t } = useTranslation<I18nObject, I18nKeys>();

  useEffect(() => {
    const steps: StepNavItem[] = [
      { label: t('activityLandscape:title'), url: '/admin/activities' },
      { label: '', url: '' },
      { label: '', url: '' },
    ];

    if (activity) {
      steps[1] = {
        label: activity.title || t('activityBlock:title'),
        url: `/admin/activity/${activity.id}/block/${activity.blockId}`,
      };
    }

    if (flowBlock) {
      steps[2] = {
        label: flowBlock.title || t('activityBlock:flows:title'),
        url: `/admin/flow/${flowBlock.id}`,
      };
    }

    if (listBlock) {
      steps[2] = {
        label: listBlock.title || t('activityBlock:tasks:title'),
        url: `/admin/list/${listBlock.id}`,
      };
    }

    if (home) {
      steps[1] = { label: '', url: '' };
      steps[2] = { label: '', url: '' };
    }

    step.setStepNav(steps.filter((step) => step.label));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};
