type Props = {
  opacity?: number;
};
export const LandscapeSvgBgArrow: React.FC<Props> = ({ opacity = 0.5 }) => {
  return (
    <svg
      className={'h-full w-16'}
      viewBox="0 0 20 500"
      fill="none"
      preserveAspectRatio={'none'}
      xmlns="http://www.w3.org/2000/svg">
      <path
        d="M-1.9997e-05 0H5.91053L20 250L5.91053 500H-1.9997e-05V0Z"
        fill="currentColor"
        opacity={opacity}
      />
    </svg>
  );
};
