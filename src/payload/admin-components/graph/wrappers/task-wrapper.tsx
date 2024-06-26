import { PropsWithChildren } from 'react';

type Props = PropsWithChildren;

export const TaskWrapper: React.FC<Props> = ({ children }) => {
  return (
    <div className={'relative h-36 w-full overflow-hidden rounded-2xl border-2 px-3 py-6'}>
      {children}
    </div>
  );
};
