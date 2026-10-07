import { zodResolver } from '@hookform/resolvers/zod'
import { BookOpen } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation } from 'react-router-dom'
import { z } from 'zod'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PasswordField } from '@/components/ui/PasswordField'
import { TextField } from '@/components/ui/TextField'
import { iniciarSesion } from './api'
import { mensajeErrorLogin } from './mensajesError'
import { useAuth } from './useAuth'

const esquema = z.object({
  correo: z.string().min(1, 'Escribe tu correo.').email('El correo parece incompleto.'),
  contrasena: z.string().min(1, 'Escribe tu contraseña.'),
})
type DatosLogin = z.infer<typeof esquema>

export function LoginPage() {
  const { session } = useAuth()
  const ubicacion = useLocation()
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DatosLogin>({ resolver: zodResolver(esquema) })

  // Si ya hay sesión (recién iniciada o guardada), vamos a donde quería entrar.
  if (session) {
    const destino = (ubicacion.state as { desde?: string } | null)?.desde ?? '/'
    return <Navigate to={destino} replace />
  }

  const enviar = async (datos: DatosLogin) => {
    setErrorGeneral(null)
    try {
      await iniciarSesion(datos.correo, datos.contrasena)
    } catch (error) {
      setErrorGeneral(mensajeErrorLogin(error))
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <aside className="bg-primario flex flex-col justify-center gap-4 p-8 text-white lg:p-16">
        <BookOpen aria-hidden size={56} />
        <p className="text-4xl font-bold">Biblioteca</p>
        <p className="max-w-sm text-xl">Control de materiales y préstamos.</p>
      </aside>

      <main className="grid place-items-center p-6 lg:p-16">
        <form
          onSubmit={handleSubmit(enviar)}
          noValidate
          className="w-full max-w-md space-y-6"
        >
          <h1 className="text-3xl font-bold">Iniciar sesión</h1>

          {errorGeneral && <Alert>{errorGeneral}</Alert>}

          <TextField
            label="Correo electrónico"
            type="email"
            autoComplete="email"
            error={errors.correo?.message}
            {...register('correo')}
          />
          <PasswordField
            label="Contraseña"
            autoComplete="current-password"
            error={errors.contrasena?.message}
            {...register('contrasena')}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-h-14 w-full text-xl"
          >
            {isSubmitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </main>
    </div>
  )
}
