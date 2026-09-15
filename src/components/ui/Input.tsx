import { InputHTMLAttributes, forwardRef } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  helpText?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { id, label, helpText, className = '', ...props },
  ref,
) {
  const helpId = helpText && id ? `${id}-help` : undefined
  return (
    <div>
      <label className="mb-2 block font-bold" htmlFor={id}>{label}</label>
      <input
        ref={ref}
        id={id}
        aria-describedby={helpId}
        className={`min-h-touch w-full rounded-lg border-2 border-slate-700 bg-white px-4 py-3 text-lg ${className}`}
        {...props}
      />
      {helpText && <p id={helpId} className="mt-2 text-base text-slate-700">{helpText}</p>}
    </div>
  )
})
