import { PropsWithChildren } from 'react';
import Link from 'next/link';

type Props = PropsWithChildren & {
  activityId: number;
  flowId: number;
};

export const FlowBlockViewLink: React.FC<Props> = ({ activityId, flowId, children }) => {
  return (
    <Link className={'link-hover link'} href={`/admin/activity/${activityId}/flow/${flowId}`}>
      {children}
    </Link>
  );
};
