import { irAlPaso } from '@/lib/guiarNavegacion'
import { useEnfocarAlCambiar } from '@/lib/useEnfocarAlCambiar'
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
    tabParam === 'agregar' || tabParam === 'buscar' ? tabParam : (tabInicial ?? 'buscar')

  const contenidoRef = useEnfocarAlCambiar(tabActiva)

  const cambiarTab = (nuevaTab: 'buscar' | 'agregar') => {
    setSearchParams({ tab: nuevaTab }, { replace: true })
    if (nuevaTab === tabActiva) irAlPaso(contenidoRef)
  }

  return (
    <div className="space-y-6">
      {/* Barra de pestañas unificada con UN SOLO botón de volver al inicio */}
      <div className="border-borde border-b-2 pb-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Materiales y libros</h1>
            <p className="text-tinta-suave text-xl">
              Catálogo general: busca libros en el inventario o registra obras nuevas.
            </p>
          </div>
          <Link
            to="/"
            className="border-borde hover:bg-papel inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 bg-white px-5 text-lg font-bold transition-all active:scale-[0.98]"
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
            className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-lg font-bold transition-colors ${
              tabActiva === 'buscar'
                ? 'bg-primario text-white shadow-xs'
                : 'text-tinta border-borde hover:bg-papel border-2 bg-white'
            }`}
          >
            <Search aria-hidden size={22} />
            Buscar y consultar inventario
          </button>
          <button
            type="button"
            onClick={() => cambiarTab('agregar')}
            aria-current={tabActiva === 'agregar' ? 'page' : undefined}
            className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-lg font-bold transition-colors ${
              tabActiva === 'agregar'
                ? 'bg-primario text-white shadow-xs'
                : 'text-tinta border-borde hover:bg-papel border-2 bg-white'
            }`}
          >
            <BookPlus aria-hidden size={22} />
            Registrar libro nuevo
          </button>
        </nav>
      </div>

      {/* Contenido sin encabezado duplicado */}
      <section
        ref={contenidoRef}
        tabIndex={-1}
        className="destino-flujo"
        aria-label="Contenido de materiales"
      >
        {tabActiva === 'buscar' ? (
          <BuscarMaterialPage ocultarEncabezado />
        ) : (
          <AgregarMaterialPage ocultarEncabezado />
        )}
      </section>
    </div>
  )
}
