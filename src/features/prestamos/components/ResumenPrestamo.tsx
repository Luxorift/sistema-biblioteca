import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import type { PrestamoConfirmado } from '../types'

export function ResumenPrestamo({
  prestamo,
  onOtro,
}: {
  prestamo: PrestamoConfirmado
  onOtro: () => void
}) {
  return (
    <section className="border-primario space-y-6 rounded-2xl border-2 bg-white p-6">
      <div>
        <h1 className="text-3xl font-bold">Préstamo registrado</h1>
        <p className="text-tinta-suave text-xl">La copia quedó marcada como prestada.</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="font-bold">Copia</dt>
          <dd>{prestamo.codigo}</dd>
        </div>
        <div>
          <dt className="font-bold">Material</dt>
          <dd>{prestamo.titulo}</dd>
        </div>
        <div>
          <dt className="font-bold">Entregado a</dt>
          <dd>{prestamo.persona}</dd>
        </div>
        <div>
          <dt className="font-bold">Fecha límite</dt>
          <dd>{prestamo.fechaLimite ?? 'No indicada'}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onOtro}>Registrar otro préstamo</Button>
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
