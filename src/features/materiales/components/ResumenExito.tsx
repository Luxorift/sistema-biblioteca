import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import type { ResumenMaterial } from '../types'

export function ResumenExito({
  resumen,
  onOtro,
}: {
  resumen: ResumenMaterial
  onOtro: () => void
}) {
  return (
    <section className="border-primario space-y-6 rounded-2xl border-2 bg-white p-6">
      <div>
        <h1 className="text-3xl font-bold">Material guardado</h1>
        <p className="text-tinta-suave text-xl">
          {resumen.titulo}. Se registraron {resumen.codigos.length}{' '}
          {resumen.codigos.length === 1 ? 'copia' : 'copias'}.
        </p>
      </div>
      <div>
        <h2 className="text-xl font-bold">Códigos generados</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {resumen.codigos.map((codigo) => (
            <li key={codigo} className="bg-papel rounded-lg px-3 py-2 font-bold">
              {codigo}
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={onOtro}>Agregar otro material</Button>
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
