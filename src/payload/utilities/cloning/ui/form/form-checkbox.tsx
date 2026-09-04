interface FormCheckboxProps {
  checked: boolean
  className?: string
  disabled?: boolean
  /** Muted text after the label, such as the record id a health finding names. */
  hint?: string
  label: string
  onChange: () => void
}

export const FormCheckbox = ({
  checked,
  className = '',
  disabled = false,
  hint,
  label,
  onChange,
}: FormCheckboxProps) => {
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
      {hint && <span className="text-xs text-[var(--theme-elevation-500)]">{hint}</span>}
    </label>
  )
}
