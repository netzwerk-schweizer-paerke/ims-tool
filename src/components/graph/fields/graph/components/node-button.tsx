type Props = {
  children?: React.ReactNode
  onClick: () => void
  className?: string
}

export const NodeButton: React.FC<Props> = ({ children, onClick, className }) => {
  return (
    <button
      type={'button'}
      className={`size-6 rounded-full border border-gray-400 bg-gray-700/70 p-1 font-bold text-white hover:bg-blue-500/90 ${className}`}
      onClick={onClick}>
      {children}
    </button>
  )
}
