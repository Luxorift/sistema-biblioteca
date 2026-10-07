import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { PasswordField } from '@/components/ui/PasswordField'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import {
  esquemaCrearUsuario,
  type FormularioCrearUsuario,
} from '../schemas'
import type { UsuarioSistema } from '../types'
import { useCrearUsuario } from '../useUsuarios'

interface Props {
  abierto: boolean
  onCerrar: () => void
  onExito: (usuario: UsuarioSistema) => void
}

export function CrearUsuarioDialog({ abierto, onCerrar, onExito }: Props) {
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const crearUsuarioMutation = useCrearUsuario()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormularioCrearUsuario>({
    resolver: zodResolver(esquemaCrearUsuario),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      rol: 'bibliotecario',
    },
  })

  const onSubmit = async (datos: FormularioCrearUsuario) => {
    setErrorEnvio(null)
    try {
      const nuevo = await crearUsuarioMutation.mutateAsync(datos)
      reset()
      onExito(nuevo)
      onCerrar()
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'Error al registrar el usuario.')
    }
  }

  const cerrarYLimpiar = () => {
    setErrorEnvio(null)
    reset()
    onCerrar()
  }

  return (
    <Dialog abierto={abierto} titulo="Registrar nuevo usuario" onCerrar={cerrarYLimpiar}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-tinta-suave text-base">
          Crea una nueva cuenta de acceso para un administrador o bibliotecario. Podrá iniciar sesión de inmediato con estos datos.
        </p>

        {errorEnvio && <Alert>{errorEnvio}</Alert>}

        <TextField
          label="Nombre completo"
          placeholder="Ej: Rosa Paredes"
          error={errors.nombre?.message}
          {...register('nombre')}
        />

        <TextField
          label="Correo electrónico"
          type="email"
          placeholder="ejemplo@biblioteca.edu.pe"
          error={errors.email?.message}
          {...register('email')}
        />

        <PasswordField
          label="Contraseña inicial"
          placeholder="Mínimo 6 caracteres"
          error={errors.password?.message}
          {...register('password')}
        />

        <Select
          label="Rol en el sistema"
          error={errors.rol?.message}
          {...register('rol')}
        >
          <option value="bibliotecario">Bibliotecario (gestión de préstamos e inventario)</option>
          <option value="admin">Administrador (acceso total y gestión de usuarios)</option>
        </Select>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variante="secundario"
            onClick={cerrarYLimpiar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creando cuenta…' : 'Guardar usuario'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
