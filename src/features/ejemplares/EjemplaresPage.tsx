import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { EditarEjemplarDialog } from './components/EditarEjemplarDialog'
import { TablaEjemplares } from './components/TablaEjemplares'
import type { EjemplarDetallado } from './types'
import { useEjemplares } from './useEjemplares'

export function EjemplaresPage() {
  const [parametros] = useSearchParams()
  const materialIdParam = parametros.get('materialId')
  const codigoParam = parametros.get('codigo')

  const { data: ejemplares = [], isLoading, isError } = useEjemplares()

  const [busqueda, setBusqueda] = useState(codigoParam ?? '')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('')
  const [ejemplarAEditar, setEjemplarAEditar] = useState<EjemplarDetallado | null>(null)
  const [exitoGuardado, setExitoGuardado] = useState(false)

  // Filtrado de ejemplares
  const filtrados = useMemo(() => {
    return ejemplares.filter((e) => {
      if (materialIdParam && String(e.materialId) !== materialIdParam) {
        return false
      }

      const coincideEstado = !estadoFiltro || e.estado === estadoFiltro

      const termino = busqueda.trim().toLowerCase()
      const autores = e.autores.join(' ').toLowerCase()
      const coincideTexto =
        !termino ||
        e.codigo.toLowerCase().includes(termino) ||
        e.titulo.toLowerCase().includes(termino) ||
        autores.includes(termino) ||
        (e.observaciones && e.observaciones.toLowerCase().includes(termino))

      return coincideEstado && coincideTexto
    })
  }, [ejemplares, materialIdParam, estadoFiltro, busqueda])

  // Estadísticas rápidas para el bibliotecario
  const estadisticas = useMemo(() => {
    let disponibles = 0
    let prestados = 0
    let enReparacion = 0
    let perdidos = 0
    let bajas = 0

    for (const e of ejemplares) {
      if (e.estado === 'disponible') disponibles++
      else if (e.estado === 'prestado') prestados++
      else if (e.estado === 'en_reparacion') enReparacion++
      else if (e.estado === 'perdido') perdidos++
      else if (e.estado === 'baja') bajas++
    }

    return {
      total: ejemplares.length,
      disponibles,
      prestados,
      enReparacion,
      perdidosBajas: perdidos + bajas,
    }
  }, [ejemplares])

  const limpiarFiltros = () => {
    setBusqueda('')
    setEstadoFiltro('')
  }

  return (
    <div className="space-y-7">
      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mantenimiento de copias físicas</h1>
          <p className="text-tinta-suave text-xl">
            Control de ejemplares, reparación de libros dañados y registro de bajas o pérdidas.
          </p>
        </div>
        <Link
          to="/"
          className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-5 text-lg font-bold"
        >
          Volver al inicio
        </Link>
      </div>

      {exitoGuardado && (
        <Alert>
          El estado y observaciones del ejemplar se actualizaron correctamente.
        </Alert>
      )}

      {isError && (
        <Alert>
          No se pudieron cargar los ejemplares. Revisa tu conexión e intenta de nuevo.
        </Alert>
      )}

      {/* Resumen de inventario físico */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="border-borde rounded-xl border-2 bg-white p-3 text-center">
          <span className="text-tinta-suave block text-sm font-semibold">Total copias</span>
          <span className="text-2xl font-bold">{estadisticas.total}</span>
        </div>
        <div className="border-emerald-300 rounded-xl border-2 bg-emerald-50/60 p-3 text-center">
          <span className="text-emerald-800 block text-sm font-semibold">Disponibles</span>
          <span className="text-2xl font-bold text-emerald-900">{estadisticas.disponibles}</span>
        </div>
        <div className="border-sky-300 rounded-xl border-2 bg-sky-50/60 p-3 text-center">
          <span className="text-sky-800 block text-sm font-semibold">Prestadas</span>
          <span className="text-2xl font-bold text-sky-900">{estadisticas.prestados}</span>
        </div>
        <div className="border-amber-300 rounded-xl border-2 bg-amber-50/60 p-3 text-center">
          <span className="text-amber-800 block text-sm font-semibold">En reparación</span>
          <span className="text-2xl font-bold text-amber-900">{estadisticas.enReparacion}</span>
        </div>
        <div className="border-rose-300 rounded-xl border-2 bg-rose-50/60 p-3 text-center">
          <span className="text-rose-800 block text-sm font-semibold">Pérdidas y bajas</span>
          <span className="text-2xl font-bold text-rose-900">{estadisticas.perdidosBajas}</span>
        </div>
      </section>

      {/* Filtros */}
      <section className="border-borde space-y-4 rounded-2xl border-2 bg-white p-5">
        <h2 className="text-2xl font-bold">Buscar copias</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <TextField
              label="Escanear o buscar código BIB-, título o autor"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Ej: BIB-000001, Don Quijote, etc."
            />
          </div>
          <Select
            label="Estado físico"
            value={estadoFiltro}
            onChange={(evento) => setEstadoFiltro(evento.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="disponible">Disponibles</option>
            <option value="prestado">Prestadas</option>
            <option value="en_reparacion">En reparación</option>
            <option value="perdido">Perdidas</option>
            <option value="baja">De baja</option>
          </Select>
        </div>
        <Button variante="secundario" onClick={limpiarFiltros}>
          Limpiar filtros
        </Button>
      </section>

      {/* Lista de ejemplares */}
      <section className="space-y-4">
        {isLoading && <p>Cargando copias físicas…</p>}

        {!isLoading && filtrados.length === 0 && (
          <div className="border-borde rounded-2xl border-2 bg-white p-5">
            <h3 className="text-xl font-bold">No hay copias que coincidan</h3>
            <p className="text-tinta-suave mt-1">
              Prueba buscando otro código o cambiando el filtro de estado.
            </p>
          </div>
        )}

        {!isLoading && filtrados.length > 0 && (
          <>
            <p className="text-tinta-suave" aria-live="polite">
              {filtrados.length}{' '}
              {filtrados.length === 1 ? 'copia encontrada' : 'copias encontradas'}.
            </p>
            <TablaEjemplares
              ejemplares={filtrados}
              onEditar={(ejemplar) => {
                setExitoGuardado(false)
                setEjemplarAEditar(ejemplar)
              }}
            />
          </>
        )}
      </section>

      {/* Diálogo de edición de estado físico */}
      <EditarEjemplarDialog
        key={ejemplarAEditar ? String(ejemplarAEditar.id) : 'cerrado'}
        ejemplar={ejemplarAEditar}
        abierto={Boolean(ejemplarAEditar)}
        onCerrar={() => setEjemplarAEditar(null)}
        onGuardado={() => setExitoGuardado(true)}
      />
    </div>
  )
}
