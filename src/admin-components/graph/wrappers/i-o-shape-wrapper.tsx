'use client';
import { PropsWithChildren } from 'react';
import './shapestyle.css';

type Props = PropsWithChildren & {
  mode?: 'edit' | 'view';
};

export const IOShapeWrapper: React.FC<Props> = ({ children, mode = 'view' }) => {
  const wrapperClasses =
    mode === 'edit' ? 'h-32 overflow-visible max-w-64' : 'size-full overflow-visible';

  return (
    <div
      className={`io-shape-wrapper relative rounded-full border-2 bg-[--theme-bg] ${wrapperClasses}`}>
      <div
        className={
          'relative z-10 flex size-full items-center justify-center px-2 py-5 text-center'
        }>
        {children}
      </div>
    </div>
  );
};
