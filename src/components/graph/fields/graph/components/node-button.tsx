type Props = {
  children?: React.ReactNode
  onClick: () => void
  className?: string
}

export const NodeButton: React.FC<Props> = ({ children, onClick, className }) => {
  return (
    <button
      type={'button'}
      className={`size-6 rounded-full bg-gray-700/60 p-1 font-bold text-white hover:bg-blue-500/90 ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
