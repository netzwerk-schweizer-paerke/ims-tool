import React from 'react'
import { FormCheckbox } from './FormCheckbox'

interface SelectAllCheckboxProps {
  checked: boolean
  onChange: () => void
  label?: string
  className?: string
}

export const SelectAllCheckbox: React.FC<SelectAllCheckboxProps> = ({
  checked,
  onChange,
  label = 'Select All',
  className = '',
}) => {
  return (
    <div className={`mb-2 border-b pb-2 ${className}`.trim()}>
      <FormCheckbox checked={checked} onChange={onChange} label={label} className="font-medium" />
    </div>
  )
}
