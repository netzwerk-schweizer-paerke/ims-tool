import { memo } from 'react'

type Props = {
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  onClick: () => void
}

// Define the component
const NodeButtonComponent = ({ children, className, disabled = false, onClick }: Props) => {
  return (
    <button
      className={`size-6 rounded-full border border-gray-400 bg-gray-700/70 p-1 font-bold text-white hover:bg-blue-500/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-700/70 ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={'button'}>
      {children}
    </button>
  )
}

// Export the memoized component
export const NodeButton = memo(NodeButtonComponent)
