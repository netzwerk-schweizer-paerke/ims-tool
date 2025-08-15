import React from 'react'

interface FormLabelProps {
  children: React.ReactNode
  htmlFor?: string
  required?: boolean
  className?: string
}

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  htmlFor,
  required,
  className = '',
}) => {
  return (
    <label htmlFor={htmlFor} className={`mb-2 block font-medium ${className}`.trim()}>
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}
