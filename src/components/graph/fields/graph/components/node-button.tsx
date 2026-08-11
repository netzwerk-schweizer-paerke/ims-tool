import { memo } from 'react'

type Props = {
  children?: React.ReactNode
  className?: string
  onClick: () => void
}

// Define the component
const NodeButtonComponent: React.FC<Props> = ({ children, className, onClick }) => {
  return (
    <button
      className={`size-6 rounded-full border border-gray-400 bg-gray-700/70 p-1 font-bold text-white hover:bg-blue-500/90 ${className}`}
      onClick={onClick}
      type={'button'}>
      {children}
    </button>
  )
}

// Export the memoized component
export const NodeButton = memo(NodeButtonComponent)
