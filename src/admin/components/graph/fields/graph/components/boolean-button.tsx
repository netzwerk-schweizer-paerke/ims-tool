type Props = {
  children?: React.ReactNode;
  onClick: () => void;
  className?: string;
};

export const BooleanButton: React.FC<Props> = ({ children, onClick, className }) => {
  return (
    <button
      type={'button'}
      className={`bg-gray-700/60 p-1 font-bold text-white hover:bg-gray-700/90 ${className}`}
      onClick={onClick}>
      {children}
    </button>
  );
};
