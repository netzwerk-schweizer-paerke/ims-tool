import React from 'react'

interface FormSectionProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export const FormSection: React.FC<FormSectionProps> = ({ children, className = '', title }) => {
  return (
    <div className={className}>
      {title && <h3 className="mb-2 font-medium">{title}</h3>}
      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 p-2">
        {children}
      </div>
    </div>
  )
}
