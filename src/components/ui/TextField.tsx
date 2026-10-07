import { useId, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export interface TextFieldProps extends ComponentProps<'input'> {
  label: string
  error?: string
}

// Campo de texto accesible: la etiqueta siempre visible y el error enlazado al campo.
export function TextField({ label, error, className, id, ...props }: TextFieldProps) {
  const autoId = useId()
  const campoId = id ?? autoId
  const errorId = `${campoId}-error`

  return (
    <div className="space-y-2">
      <label htmlFor={campoId} className="block text-lg font-bold">
        {label}
      </label>
      <input
        id={campoId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          'min-h-12 w-full rounded-xl border-2 bg-white px-4 text-lg',
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
