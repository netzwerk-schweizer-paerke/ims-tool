import { memo } from 'react'

type Props = {
  children?: React.ReactNode
  className?: string
  onClick: () => void
}

// Define the component
const BooleanButtonComponent = ({ children, className, onClick }: Props) => {
  return (
    <button
      className={`bg-gray-700/60 p-1 font-bold text-white hover:bg-gray-700/90 ${className}`}
      onClick={onClick}
      type={'button'}>
      {children}
    </button>
  )
}

// Export the memoized component
export const BooleanButton = memo(BooleanButtonComponent)
