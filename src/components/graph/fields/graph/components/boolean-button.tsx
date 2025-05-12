import { memo } from 'react'

type Props = {
  children?: React.ReactNode
  onClick: () => void
  className?: string
}

// Define the component
const BooleanButtonComponent: React.FC<Props> = ({ children, onClick, className }) => {
  return (
    <button
      type={'button'}
      className={`bg-gray-700/60 p-1 font-bold text-white hover:bg-gray-700/90 ${className}`}
      onClick={onClick}>
      {children}
    </button>
  )
}

// Export the memoized component
export const BooleanButton = memo(BooleanButtonComponent)
