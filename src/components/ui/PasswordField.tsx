import { Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { TextField, type TextFieldProps } from './TextField'

// Campo de contraseña con botón para ver lo que se escribe (ayuda a evitar errores de tipeo).
export function PasswordField(props: Omit<TextFieldProps, 'type'>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="space-y-2">
      <TextField {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-primario inline-flex min-h-11 items-center gap-2 rounded-lg px-1 text-base font-bold underline"
      >
        {visible ? <EyeOff aria-hidden size={20} /> : <Eye aria-hidden size={20} />}
        {visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      </button>
    </div>
  )
}
