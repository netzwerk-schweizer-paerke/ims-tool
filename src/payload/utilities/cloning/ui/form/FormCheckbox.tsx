import React from 'react'

interface FormCheckboxProps {
  checked: boolean
  onChange: () => void
  label: string
  disabled?: boolean
  className?: string
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) => {
  return (
    <label
      className={`flex items-center gap-2 py-1 ${
        !disabled ? 'cursor-pointer hover:bg-gray-100/20' : 'cursor-not-allowed opacity-50'
      } ${className}`.trim()}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4"
      />
      <span>{label}</span>
    </label>
  )
}
