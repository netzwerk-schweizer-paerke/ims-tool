import { PropsWithChildren } from 'react';
import Link from 'next/link';

type Props = PropsWithChildren & {
  flowId: number;
};

export const FlowBlockViewLink: React.FC<Props> = ({ flowId, children }) => {
  return (
    <Link className={'link-hover link hyphens-auto'} href={`/admin/flow/${flowId}`}>
      {children}
    </Link>
  );
};
