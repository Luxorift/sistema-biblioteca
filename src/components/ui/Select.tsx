import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export interface SelectProps extends ComponentProps<'select'> {
  label: string
  error?: string
  children: React.ReactNode
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const autoId = useId()
  const campoId = id ?? autoId
  const errorId = `${campoId}-error`

  return (
    <div className="space-y-2">
      <label htmlFor={campoId} className="block text-lg font-bold">
        {label}
      </label>
      <select
        id={campoId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'min-h-12 w-full rounded-xl border-2 bg-white px-4 text-lg',
          error ? 'border-peligro' : 'border-borde',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="text-peligro text-base font-bold">
          {error}
        </p>
      )}
    </div>
  )
}
