import React from 'react'

interface FormCheckboxProps {
  checked: boolean
  className?: string
  disabled?: boolean
  label: string
  onChange: () => void
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  checked,
  className = '',
  disabled = false,
  label,
  onChange,
}) => {
  return (
    <label
      className={`flex items-center gap-2 py-1 ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-100/20'
      } ${className}`.trim()}>
      <input
        checked={checked}
        className="h-4 w-4"
        disabled={disabled}
        onChange={onChange}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )
}
