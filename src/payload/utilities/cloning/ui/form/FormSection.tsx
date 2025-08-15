import React from 'react'

interface FormSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export const FormSection: React.FC<FormSectionProps> = ({ title, children, className = '' }) => {
  return (
    <div className={className}>
      {title && <h3 className="mb-2 font-medium">{title}</h3>}
      <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 p-2">
        {children}
      </div>
    </div>
  )
}
