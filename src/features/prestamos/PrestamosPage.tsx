import { BookDown, BookUp, ClipboardList } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { DevolverPage } from '@/features/devoluciones'
import { HistorialPrestamosPage } from './HistorialPrestamosPage'
import { PrestarPage } from './PrestarPage'

export type TabPrestamos = 'devolver' | 'prestar' | 'historial'

interface Props {
  tabInicial?: TabPrestamos
}

export function PrestamosPage({ tabInicial }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab') as TabPrestamos | null

  // Determinar pestaña activa: URL param -> prop inicial -> 'devolver' (lo más frecuente)
  const tabActiva: TabPrestamos =
    tabParam === 'devolver' || tabParam === 'prestar' || tabParam === 'historial'
      ? tabParam
      : tabInicial ?? 'devolver'

  const cambiarTab = (nuevaTab: TabPrestamos) => {
    setSearchParams({ tab: nuevaTab }, { replace: true })
  }

  return (
    <div className="space-y-6">
      {/* Barra de pestañas unificada del mostrador */}
      <div className="border-b-2 border-borde pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">Mostrador de préstamos y devoluciones</h1>
            <p className="text-tinta-suave text-xl">
              Entrega libros a personas, registra devoluciones y consulta préstamos pendientes o morosos.
            </p>
          </div>
          <Link
            to="/"
            className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-5 text-lg font-bold"
          >
            Volver al inicio
          </Link>
        </div>

        <nav
          className="flex flex-wrap gap-3"
          aria-label="Pestañas de préstamos y devoluciones"
        >
          <button
            type="button"
            onClick={() => cambiarTab('devolver')}
            aria-current={tabActiva === 'devolver' ? 'page' : undefined}
            className={`min-h-12 rounded-xl px-5 py-2.5 text-lg font-bold transition-colors inline-flex items-center gap-2 ${
              tabActiva === 'devolver'
                ? 'bg-primario text-white'
                : 'bg-white text-tinta border-2 border-borde hover:bg-papel'
            }`}
          >
            <BookDown aria-hidden size={22} />
            Devolver material
          </button>
          <button
            type="button"
            onClick={() => cambiarTab('prestar')}
            aria-current={tabActiva === 'prestar' ? 'page' : undefined}
            className={`min-h-12 rounded-xl px-5 py-2.5 text-lg font-bold transition-colors inline-flex items-center gap-2 ${
              tabActiva === 'prestar'
                ? 'bg-primario text-white'
                : 'bg-white text-tinta border-2 border-borde hover:bg-papel'
            }`}
          >
            <BookUp aria-hidden size={22} />
            Prestar material
          </button>
          <button
            type="button"
            onClick={() => cambiarTab('historial')}
            aria-current={tabActiva === 'historial' ? 'page' : undefined}
            className={`min-h-12 rounded-xl px-5 py-2.5 text-lg font-bold transition-colors inline-flex items-center gap-2 ${
              tabActiva === 'historial'
                ? 'bg-primario text-white'
                : 'bg-white text-tinta border-2 border-borde hover:bg-papel'
            }`}
          >
            <ClipboardList aria-hidden size={22} />
            Historial y morosos
          </button>
        </nav>
      </div>

      {/* Contenido según la pestaña */}
      {tabActiva === 'devolver' && <DevolverPage />}
      {tabActiva === 'prestar' && <PrestarPage />}
      {tabActiva === 'historial' && <HistorialPrestamosPage />}
    </div>
  )
}
