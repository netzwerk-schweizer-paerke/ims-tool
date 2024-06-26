import { LineVertical } from '@/payload/admin-components/graph/connectors/line-vertical';

export const ConnectionRightPassBy: React.FC = () => {
  return (
    <div className={'flex h-full flex-row'}>
      <div className={'flex w-12 flex-row items-center justify-center'}></div>
      <div className={'flex h-full flex-col'}>
        <LineVertical />
      </div>
    </div>
  );
};
