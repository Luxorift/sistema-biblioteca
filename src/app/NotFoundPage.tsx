import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-4 p-6">
      <h1 className="text-3xl font-bold">No encontramos esa página</h1>
      <p className="text-tinta-suave text-xl">Puede que el enlace esté mal escrito.</p>
      <Link
        to="/"
        className="text-primario inline-block min-h-11 py-2 text-lg font-bold underline"
      >
        Ir al inicio
      </Link>
    </main>
  )
}
