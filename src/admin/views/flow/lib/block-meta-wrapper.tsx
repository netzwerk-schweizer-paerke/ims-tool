import { PropsWithChildren } from 'react';

export const BlockMetaWrapper: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className={'prose prose-lg w-full max-w-none border-b border-b-gray-500 py-8 pl-6'}>
      {children}
    </div>
  );
};
