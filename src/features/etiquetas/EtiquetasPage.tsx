import { ArrowLeft } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { IndicadorCarga } from '@/components/feedback'
import { EtiquetaImprimible } from './components/EtiquetaImprimible'
import { FiltrosEtiquetas } from './components/FiltrosEtiquetas'
import type { FormatoEtiqueta } from './types'
import { useCopiasParaEtiquetas } from './useEtiquetas'

export function EtiquetasPage() {
  const [parametros] = useSearchParams()
  const materialIdParam = parametros.get('materialId')
  const codigosParam = parametros.get('codigos')

  const { data: copias = [], isLoading, isError } = useCopiasParaEtiquetas()

  const [busqueda, setBusqueda] = useState('')
  const [formato, setFormato] = useState<FormatoEtiqueta>('ambos')
  const [vistaPrevia, setVistaPrevia] = useState(false)

  // Inicializar selección según query params si existen
  const [seleccionados, setSeleccionados] = useState<Set<number>>(() => new Set())
  const [parametrosInicializados, setParametrosInicializados] = useState(false)

  // Al cargar las copias, preseleccionar según params si aplica
  if (!parametrosInicializados && copias.length > 0) {
    const inicial = new Set<number>()
    const codigosFiltro = codigosParam
      ? codigosParam.split(',').map((c) => c.trim().toUpperCase())
      : []

    for (const c of copias) {
      if (materialIdParam && String(c.materialId) === materialIdParam) {
        inicial.add(c.id)
      } else if (codigosFiltro.length > 0 && codigosFiltro.includes(c.codigo.toUpperCase())) {
        inicial.add(c.id)
      }
    }

    if (inicial.size > 0) {
      setSeleccionados(inicial)
      setVistaPrevia(true) // Si viene de guardar material o buscar, mostrar directo vista previa
    }
    setParametrosInicializados(true)
  }

  // Filtrado de copias en pantalla
  const copiasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return copias

    return copias.filter((c) => {
      const autores = c.autores.join(' ').toLowerCase()
      return (
        c.titulo.toLowerCase().includes(termino) ||
        c.codigo.toLowerCase().includes(termino) ||
        autores.includes(termino) ||
        (c.ubicacion && c.ubicacion.toLowerCase().includes(termino))
      )
    })
  }, [copias, busqueda])

  const idsFiltrados = useMemo(
    () => copiasFiltradas.map((c) => c.id),
    [copiasFiltradas],
  )

  const todasSeleccionadas =
    idsFiltrados.length > 0 &&
    idsFiltrados.every((id) => seleccionados.has(id))

  const toggleTodas = () => {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev)
      if (todasSeleccionadas) {
        for (const id of idsFiltrados) siguiente.delete(id)
      } else {
        for (const id of idsFiltrados) siguiente.add(id)
      }
      return siguiente
    })
  }

  const toggleUna = (id: number) => {
    setSeleccionados((prev) => {
      const siguiente = new Set(prev)
      if (siguiente.has(id)) {
        siguiente.delete(id)
      } else {
        siguiente.add(id)
      }
      return siguiente
    })
  }

  const copiasParaImprimir = useMemo(
    () => copias.filter((c) => seleccionados.has(c.id)),
    [copias, seleccionados],
  )

  const imprimir = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Cabecera (oculta al imprimir) */}
      <header className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold">Etiquetas para libros</h1>
          <p className="text-tinta-suave text-xl">
            Genera códigos de barras Code 128 y QR para pegar en los ejemplares.
          </p>
        </div>
        <Link
          to="/"
          className="border-borde inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 bg-white px-5 text-lg font-bold transition-all hover:bg-papel active:scale-[0.98]"
        >
          <ArrowLeft aria-hidden size={20} />
          Volver al inicio
        </Link>
      </header>

      {isError && (
        <Alert>
          No se pudieron cargar los ejemplares. Revisa tu conexión e intenta de nuevo.
        </Alert>
      )}

      {isLoading && (
        <div className="print:hidden">
          <IndicadorCarga
            mensaje="Cargando ejemplares para etiquetas…"
            subtexto="Generando vistas de códigos de barra y QR."
          />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Controles de búsqueda, formato e impresión */}
          <FiltrosEtiquetas
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            formato={formato}
            onFormatoChange={setFormato}
            totalFiltradas={copiasFiltradas.length}
            totalSeleccionadas={seleccionados.size}
            todasSeleccionadas={todasSeleccionadas}
            onToggleTodas={toggleTodas}
            onImprimir={imprimir}
          />

          {/* Selector de modo: Lista para marcar vs Vista previa de etiquetas */}
          <div className="flex items-center gap-3 print:hidden">
            <Button
              type="button"
              variante={!vistaPrevia ? 'primario' : 'secundario'}
              onClick={() => setVistaPrevia(false)}
            >
              Lista de ejemplares
            </Button>
            <Button
              type="button"
              variante={vistaPrevia ? 'primario' : 'secundario'}
              onClick={() => setVistaPrevia(true)}
              disabled={seleccionados.size === 0}
            >
              Vista previa de etiquetas ({seleccionados.size})
            </Button>
          </div>

          {/* Vista 1: Lista seleccionable (oculta al imprimir) */}
          {!vistaPrevia && (
            <section className="print:hidden">
              {copiasFiltradas.length === 0 ? (
                <div className="border-borde rounded-2xl border-2 bg-white p-5">
                  <p>No se encontraron ejemplares con ese criterio.</p>
                </div>
              ) : (
                <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
                  <table className="w-full min-w-200 border-collapse text-left">
                    <thead className="bg-papel">
                      <tr>
                        <th className="w-12 p-4 text-center">
                          <input
                            type="checkbox"
                            checked={todasSeleccionadas}
                            onChange={toggleTodas}
                            className="h-5 w-5 cursor-pointer accent-emerald-700"
                            aria-label="Seleccionar todos los ejemplares visibles"
                          />
                        </th>
                        <th className="p-4">Código</th>
                        <th className="p-4">Título del material</th>
                        <th className="p-4">Tipo</th>
                        <th className="p-4">Ubicación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {copiasFiltradas.map((copia) => {
                        const seleccionada = seleccionados.has(copia.id)
                        return (
                          <tr
                            key={copia.id}
                            className={`border-borde cursor-pointer border-t-2 hover:bg-emerald-50/40 ${
                              seleccionada ? 'bg-emerald-50/70' : ''
                            }`}
                            onClick={() => toggleUna(copia.id)}
                          >
                            <td
                              className="p-4 text-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                checked={seleccionada}
                                onChange={() => toggleUna(copia.id)}
                                className="h-5 w-5 cursor-pointer accent-emerald-700"
                                aria-label={`Seleccionar ejemplar ${copia.codigo}`}
                              />
                            </td>
                            <td className="p-4 font-mono font-bold text-black">
                              {copia.codigo}
                            </td>
                            <td className="p-4 font-semibold text-gray-900">
                              {copia.titulo}
                            </td>
                            <td className="p-4 text-gray-700">{copia.tipo}</td>
                            <td className="p-4 text-gray-700">
                              {copia.ubicacion ?? '—'}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* Vista 2: Cuadrícula de etiquetas (visible en pantalla si está en vista previa, y SIEMPRE visible al imprimir) */}
          <section
            className={`${
              vistaPrevia ? 'block' : 'hidden print:block'
            } space-y-4`}
          >
            <div className="flex items-center justify-between print:hidden">
              <h2 className="text-xl font-bold">
                Hojas de impresión ({copiasParaImprimir.length} etiquetas listas)
              </h2>
              <Button type="button" onClick={imprimir}>
                Mandar a imprimir
              </Button>
            </div>

            {copiasParaImprimir.length === 0 ? (
              <p className="border-borde rounded-xl border-2 bg-white p-4 print:hidden">
                Selecciona al menos un ejemplar en la lista para ver sus etiquetas.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 print:grid-cols-3 print:gap-3 print:p-0">
                {copiasParaImprimir.map((copia) => (
                  <EtiquetaImprimible
                    key={copia.id}
                    copia={copia}
                    formato={formato}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
