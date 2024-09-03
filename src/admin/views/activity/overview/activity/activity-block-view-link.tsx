import { PropsWithChildren } from 'react';
import Link from 'next/link';

type Props = PropsWithChildren & {
  activityId: number;
  blockId: string | null | undefined;
};

export const ActivityBlockViewLink: React.FC<Props> = ({ activityId, blockId, children }) => {
  return (
    <Link
      className={'link-hover link hyphens-auto'}
      href={`/admin/activity/${activityId}/block/${blockId}`}>
      {children}
    </Link>
  );
};
