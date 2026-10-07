import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps extends ComponentProps<'textarea'> {
  label: string
  error?: string
}

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const autoId = useId()
  const campoId = id ?? autoId
  const errorId = `${campoId}-error`
  return (
    <div className="space-y-2">
      <label htmlFor={campoId} className="block text-lg font-bold">
        {label}
      </label>
      <textarea
        id={campoId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'min-h-28 w-full rounded-xl border-2 bg-white px-4 py-3 text-lg',
          error ? 'border-peligro' : 'border-borde',
          className,
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-peligro text-base font-bold">
          {error}
        </p>
      )}
    </div>
  )
}
