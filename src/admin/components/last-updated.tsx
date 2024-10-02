import { Translate } from '@/lib/translate';

type Props = {
  date?: string;
};

export const LastUpdated: React.FC<Props> = ({ date }) => {
  return (
    <div className={'flex flex-row gap-4'}>
      <div>
        <Translate k={'common:lastUpdated'} />:
      </div>
      <div>
        {date
          ? new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString()
          : ''}
      </div>
    </div>
  );
};
