'use client';
import { useTranslation } from '@payloadcms/ui';

export const OverviewTitle: React.FC = () => {
  const { t } = useTranslation();

  return <h1 id="custom-view-title">{t('activityLandscape:title' as Parameters<typeof t>[0])}</h1>;
};
