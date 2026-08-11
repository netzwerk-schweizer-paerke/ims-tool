import React from 'react'

interface FormLabelProps {
  children: React.ReactNode
  className?: string
  htmlFor?: string
  required?: boolean
}

export const FormLabel: React.FC<FormLabelProps> = ({
  children,
  className = '',
  htmlFor,
  required,
}) => {
  return (
    <label className={`mb-2 block font-medium ${className}`.trim()} htmlFor={htmlFor}>
      {children}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>
  )
}
