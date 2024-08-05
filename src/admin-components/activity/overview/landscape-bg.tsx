import { LandscapeSvgBgArrow } from '@/admin-components/activity/overview/activity/lib/landscape-svg-bg-arrow';

type Props = {
  rotate?: 90 | 180;
  opacity?: number;
};

export const LandscapeBg: React.FC<Props> = ({ rotate = 0, opacity = 0.33 }) => {
  return (
    <div
      className={`absolute inset-0 z-0 flex flex-row items-stretch justify-stretch ${rotate === 180 ? 'rotate-180' : ''} ${rotate === 90 ? 'rotate-90' : ''}`}>
      <svg
        className={'h-full grow'}
        viewBox="0 0 20 500"
        fill="none"
        preserveAspectRatio={'none'}
        xmlns="http://www.w3.org/2000/svg">
        <path d="M0 0H20V500H0V0Z" fill="currentColor" opacity={opacity} />
      </svg>
      <LandscapeSvgBgArrow opacity={opacity} />
    </div>
  );
};
