import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import type { DevolucionConfirmada } from '../types'

export function ResumenDevolucion({
  devolucion,
  onOtra,
}: {
  devolucion: DevolucionConfirmada
  onOtra: () => void
}) {
  return (
    <section className="border-primario space-y-6 rounded-2xl border-2 bg-white p-6">
      <div>
        <h1 className="text-3xl font-bold">Devolución registrada</h1>
        <p className="text-tinta-suave text-xl">
          La copia quedó disponible para un nuevo préstamo.
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="font-bold">Copia</dt>
          <dd>{devolucion.codigo}</dd>
        </div>
        <div>
          <dt className="font-bold">Material</dt>
          <dd>{devolucion.titulo}</dd>
        </div>
        <div>
          <dt className="font-bold">Devuelto por</dt>
          <dd>{devolucion.persona}</dd>
        </div>
        <div>
          <dt className="font-bold">Fecha de devolución</dt>
          <dd>{devolucion.fechaDevolucion}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onOtra}>Registrar otra devolución</Button>
        <Link
          to="/"
          className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-5 text-lg font-bold"
        >
          Ir al inicio
        </Link>
      </div>
    </section>
  )
}
