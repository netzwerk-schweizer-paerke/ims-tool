import { ActivityEditLink } from '@/admin/views/activity/overview/activity/activity-edit-link';
import { Activity } from '@/types/payload-types';

type Props = {
  activity: Activity;
  locale: string;
};

export const ActivityTitles: React.FC<Props> = ({ activity, locale }) => {
  return (
    <div className={'px-4 text-center'}>
      <h2 className={'w-52 hyphens-auto text-xl'}>{activity.name}</h2>
      <ActivityEditLink id={activity.id} locale={locale} />
    </div>
  );
};