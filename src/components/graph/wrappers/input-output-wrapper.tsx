import { PropsWithChildren } from 'react';

type Props = PropsWithChildren;

export const InputOutputWrapper: React.FC<Props> = ({ children }) => {
  return (
    <div className={'h-36 w-full overflow-hidden rounded-full border-2 px-3 py-6'}>{children}</div>
  );
};
