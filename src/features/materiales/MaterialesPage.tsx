import { ArrowLeft, BookPlus, Search } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { BuscarMaterialPage } from '@/features/buscar-materiales'
import { AgregarMaterialPage } from './AgregarMaterialPage'

interface Props {
  tabInicial?: 'buscar' | 'agregar'
}

export function MaterialesPage({ tabInicial }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')

  // Determinar la pestaña activa: url param -> prop inicial -> 'buscar'
  const tabActiva: 'buscar' | 'agregar' =
    tabParam === 'agregar' || tabParam === 'buscar'
      ? tabParam
      : tabInicial ?? 'buscar'

  const cambiarTab = (nuevaTab: 'buscar' | 'agregar') => {
    setSearchParams({ tab: nuevaTab }, { replace: true })
  }

  return (
    <div className="space-y-6">
      {/* Barra de pestañas unificada con UN SOLO botón de volver al inicio */}
      <div className="border-b-2 border-borde pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold">Materiales y libros</h1>
            <p className="text-tinta-suave text-xl">
              Catálogo general: busca libros en el inventario o registra obras nuevas.
            </p>
          </div>
          <Link
            to="/"
            className="border-borde inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 bg-white px-5 text-lg font-bold transition-all hover:bg-papel active:scale-[0.98]"
          >
            <ArrowLeft aria-hidden size={20} />
            Volver al inicio
          </Link>
        </div>

        <nav
          className="flex flex-wrap gap-3"
          aria-label="Pestañas de gestión de materiales"
        >
          <button
            type="button"
            onClick={() => cambiarTab('buscar')}
            aria-current={tabActiva === 'buscar' ? 'page' : undefined}
            className={`min-h-12 rounded-xl px-5 py-2.5 text-lg font-bold transition-colors inline-flex items-center gap-2 cursor-pointer ${
              tabActiva === 'buscar'
                ? 'bg-primario text-white shadow-xs'
                : 'bg-white text-tinta border-2 border-borde hover:bg-papel'
            }`}
          >
            <Search aria-hidden size={22} />
            Buscar y consultar inventario
          </button>
          <button
            type="button"
            onClick={() => cambiarTab('agregar')}
            aria-current={tabActiva === 'agregar' ? 'page' : undefined}
            className={`min-h-12 rounded-xl px-5 py-2.5 text-lg font-bold transition-colors inline-flex items-center gap-2 cursor-pointer ${
              tabActiva === 'agregar'
                ? 'bg-primario text-white shadow-xs'
                : 'bg-white text-tinta border-2 border-borde hover:bg-papel'
            }`}
          >
            <BookPlus aria-hidden size={22} />
            Registrar libro nuevo
          </button>
        </nav>
      </div>

      {/* Contenido sin encabezado duplicado */}
      {tabActiva === 'buscar' ? (
        <BuscarMaterialPage ocultarEncabezado />
      ) : (
        <AgregarMaterialPage ocultarEncabezado />
      )}
    </div>
  )
}
