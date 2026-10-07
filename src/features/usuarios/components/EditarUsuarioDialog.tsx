import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import {
  esquemaEditarUsuario,
  type FormularioEditarUsuario,
} from '../schemas'
import type { UsuarioSistema } from '../types'
import { useActualizarUsuario } from '../useUsuarios'

interface Props {
  usuario: UsuarioSistema | null
  abierto: boolean
  onCerrar: () => void
  onExito: () => void
  esUsuarioActual: boolean
}

export function EditarUsuarioDialog({
  usuario,
  abierto,
  onCerrar,
  onExito,
  esUsuarioActual,
}: Props) {
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const actualizarMutation = useActualizarUsuario()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormularioEditarUsuario>({
    resolver: zodResolver(esquemaEditarUsuario),
    defaultValues: {
      nombre: '',
      rol: 'bibliotecario',
      activo: true,
    },
  })

  useEffect(() => {
    if (usuario) {
      reset({
        nombre: usuario.nombre,
        rol: usuario.rol,
        activo: usuario.activo,
      })
    }
  }, [usuario, reset])

  const onSubmit = async (datos: FormularioEditarUsuario) => {
    if (!usuario) return
    setErrorEnvio(null)
    try {
      await actualizarMutation.mutateAsync({
        id: usuario.id,
        input: datos,
      })
      onExito()
      onCerrar()
    } catch (err) {
      setErrorEnvio(err instanceof Error ? err.message : 'Error al guardar cambios.')
    }
  }

  return (
    <Dialog abierto={abierto} titulo="Editar usuario" onCerrar={onCerrar}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {errorEnvio && <Alert>{errorEnvio}</Alert>}

        <TextField
          label="Nombre completo"
          error={errors.nombre?.message}
          {...register('nombre')}
        />

        <Select
          label="Rol en el sistema"
          error={errors.rol?.message}
          {...register('rol')}
          disabled={esUsuarioActual}
        >
          <option value="bibliotecario">Bibliotecario</option>
          <option value="admin">Administrador</option>
        </Select>
        {esUsuarioActual && (
          <p className="text-tinta-suave text-sm">
            No puedes cambiar tu propio rol desde aquí para evitar perder acceso de administrador.
          </p>
        )}

        <div className="space-y-2">
          <label className="block text-lg font-bold">Estado de la cuenta</label>
          <label className="flex items-center gap-3 text-lg cursor-pointer">
            <input
              type="checkbox"
              className="h-6 w-6 rounded border-2 border-borde accent-primario"
              disabled={esUsuarioActual}
              {...register('activo')}
            />
            <span>Cuenta activa (puede iniciar sesión en el sistema)</span>
          </label>
          {esUsuarioActual && (
            <p className="text-tinta-suave text-sm">
              No puedes desactivar tu propia cuenta mientras estás conectado.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variante="secundario"
            onClick={onCerrar}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
