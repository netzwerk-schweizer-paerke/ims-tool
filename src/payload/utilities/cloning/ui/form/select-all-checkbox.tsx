import React from 'react'

import { FormCheckbox } from './form-checkbox'

interface SelectAllCheckboxProps {
  checked: boolean
  className?: string
  label?: string
  onChange: () => void
}

export const SelectAllCheckbox: React.FC<SelectAllCheckboxProps> = ({
  checked,
  className = '',
  label = 'Select All',
  onChange,
}) => {
  return (
    <div className={`mb-2 border-b pb-2 ${className}`.trim()}>
      <FormCheckbox checked={checked} className="font-medium" label={label} onChange={onChange} />
    </div>
  )
}
