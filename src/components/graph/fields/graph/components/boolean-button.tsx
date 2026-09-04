import { memo } from 'react'

type Props = {
  children?: React.ReactNode
  className?: string
  disabled?: boolean
  onClick: () => void
}

// Define the component
const BooleanButtonComponent = ({ children, className, disabled = false, onClick }: Props) => {
  return (
    <button
      className={`bg-gray-700/60 p-1 font-bold text-white hover:bg-gray-700/90 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-gray-700/60 ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={'button'}>
      {children}
    </button>
  )
}

// Export the memoized component
export const BooleanButton = memo(BooleanButtonComponent)
