'use client';
import { PropsWithChildren } from 'react';
import './shapestyle.css';

type Props = PropsWithChildren & {
  mode?: 'edit' | 'view';
};

export const TaskShapeWrapper: React.FC<Props> = ({ children, mode = 'view' }) => {
  const wrapperClasses = mode === 'edit' ? 'h-32 overflow-visible' : 'size-full overflow-visible';

  return (
    <div className={`task-shape-wrapper relative rounded-xl border-2 ${wrapperClasses}`}>
      <div
        className={
          'relative z-10 flex size-full items-center justify-center px-2 py-5 text-center'
        }>
        {children}
      </div>
    </div>
  );
};
