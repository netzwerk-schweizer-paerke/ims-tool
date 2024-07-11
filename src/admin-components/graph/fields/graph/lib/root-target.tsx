import { PropsWithChildren } from 'react';

type Props = PropsWithChildren & {
  id: string | null | undefined;
};

export const RootTargetName = 'root';

export const RootTarget: React.FC<Props> = ({ children, id }) => {
  if (!id) {
    throw new Error('RootTarget requires an id prop');
  }
  return (
    <div id={`${id}-${RootTargetName}`} className={'root-target'}>
      {children}
    </div>
  );
};
