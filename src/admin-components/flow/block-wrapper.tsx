import { PropsWithChildren } from 'react';
import { OuterTargets } from '@/admin-components/graph/fields/graph/lib/outer-targets';
import { RootTargetName } from '@/admin-components/graph/fields/graph/lib/root-target';

type Props = PropsWithChildren & {
  id: string | null | undefined;
  position: 'left' | 'right';
};

export const BlockWrapper: React.FC<Props> = ({ children, id, position }) => {
  if (!id) {
    throw new Error('BlockWrapper requires an id prop');
  }
  return (
    <div className={`flow-block relative flex size-full items-center justify-center p-8`}>
      <div className={'relative flex min-h-24 min-w-44 items-center justify-center text-center'}>
        <div id={`${id}-${RootTargetName}`} className={'root-target'}>
          {children}
        </div>
      </div>
      <OuterTargets id={id} debug={false} />
    </div>
  );
};
