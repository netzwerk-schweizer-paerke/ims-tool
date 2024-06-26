import { LineHorizontal } from '@/payload/admin-components/graph/connectors/line-horizontal';
import { LineVertical } from '@/payload/admin-components/graph/connectors/line-vertical';
import { ArrowDown } from '@/payload/admin-components/graph/connectors/arrows/arrow-down';

export const ConnectionRightOutBottom: React.FC = () => {
  return (
    <div className={'flex h-full flex-row'}>
      <div className={'flex flex-row items-center justify-center'}>
        <LineHorizontal />
      </div>
      <div className={'flex h-full flex-col'}>
        <div className={'h-1/2'}></div>
        <div className={'flex h-1/2 flex-col items-center justify-center'}>
          <LineVertical />
          <ArrowDown />
        </div>
      </div>
    </div>
  );
};
