import { Link } from 'react-router-dom'

// Pantalla temporal de las secciones que aún no se construyen.
// Cuando una sección esté lista, se reemplaza en app/router.tsx por su página real.
export function ComingSoonPage({ titulo }: { titulo: string }) {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{titulo}</h1>
      <p className="text-tinta-suave text-xl">Esta sección se está construyendo.</p>
      <Link
        to="/"
        className="text-primario inline-block min-h-11 py-2 text-lg font-bold underline"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
