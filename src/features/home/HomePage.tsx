import { useAuth } from '@/features/auth'
import { accionesInicio } from './acciones'
import { ActionTile } from './ActionTile'

export function HomePage() {
  const { perfil } = useAuth()
  const primerNombre = perfil?.nombre.split(' ')[0]

  const accionesPermitidas = accionesInicio.filter((accion) => {
    if (accion.soloAdmin && perfil?.rol !== 'admin') {
      return false
    }
    return true
  })

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-4xl font-bold">Hola, {primerNombre}</h1>
        <p className="text-tinta-suave text-xl">¿Qué quieres hacer hoy?</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {accionesPermitidas.map((accion) => (
          <ActionTile key={accion.id} accion={accion} />
        ))}
      </div>
    </div>
  )
}
