import { ArrowLeft } from '@/payload/admin-components/graph/connectors/arrows/arrow-left';
import { LineHorizontal } from '@/payload/admin-components/graph/connectors/line-horizontal';
import { LineVertical } from '@/payload/admin-components/graph/connectors/line-vertical';

export const ConnectionRightInBottom: React.FC = () => {
  return (
    <div className={'flex h-full flex-row'}>
      <div className={'flex flex-row items-center justify-center'}>
        <ArrowLeft />
        <LineHorizontal />
      </div>
      <div className={'flex h-full flex-col'}>
        <div className={'h-1/2'}></div>
        <div className={'h-1/2'}>
          <LineVertical />
        </div>
      </div>
    </div>
  );
};
