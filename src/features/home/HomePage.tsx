import { useAuth } from '@/features/auth'
import { accionesInicio } from './acciones'
import { ActionTile } from './ActionTile'

export function HomePage() {
  const { perfil } = useAuth()

  const accionesPermitidas = accionesInicio.filter((accion) => {
    if (accion.soloAdmin && perfil?.rol !== 'admin') {
      return false
    }
    return true
  })

  return (
    <div className="mx-auto w-full max-w-4xl py-2">
      {/* Contenedor de tarjetas centrado y equilibrado en pantallas grandes */}
      <div className="grid gap-6 sm:grid-cols-2">
        {accionesPermitidas.map((accion) => (
          <ActionTile key={accion.id} accion={accion} />
        ))}
      </div>
    </div>
  )
}
