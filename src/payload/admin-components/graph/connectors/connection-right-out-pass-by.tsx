import { LineHorizontal } from '@/payload/admin-components/graph/connectors/line-horizontal';
import { LineVertical } from '@/payload/admin-components/graph/connectors/line-vertical';
import { ArrowUp } from '@/payload/admin-components/graph/connectors/arrows/arrow-up';
import { ArrowDown } from '@/payload/admin-components/graph/connectors/arrows/arrow-down';

export const ConnectionRightOutPassBy: React.FC = () => {
  return (
    <div className={'flex h-full flex-row'}>
      <div className={'flex flex-row items-center justify-center'}>
        <LineHorizontal />
      </div>
      <div className={'flex h-full flex-col items-center justify-center'}>
        <ArrowUp />
        <LineVertical />
        <ArrowDown />
      </div>
    </div>
  );
};
