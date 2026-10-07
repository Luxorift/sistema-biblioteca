import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { EstadoPrestamoBadge } from './components/EstadoPrestamoBadge'
import { usePrestamosHistoricos } from './useHistorial'
import type { PrestamoHistorico } from './types'

// Posibles valores del filtro de estado
type FiltroEstado = 'todos' | 'pendiente' | 'devuelto' | 'atrasado'

function formatearFecha(iso: string | null): string {
  if (!iso) return '—'
  // Las fechas vienen como YYYY-MM-DD tras el slice en api.ts
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

function filtrarPrestamos(
  prestamos: PrestamoHistorico[],
  buscar: string,
  desde: string,
  hasta: string,
  estado: FiltroEstado,
): PrestamoHistorico[] {
  const termino = buscar.trim().toLowerCase()
  return prestamos.filter((p) => {
    if (termino) {
      const texto = `${p.codigo} ${p.titulo} ${p.persona} ${p.dni} ${p.tipoPersona}`.toLowerCase()
      if (!texto.includes(termino)) return false
    }
    if (desde && p.fechaPrestamo < desde) return false
    if (hasta && p.fechaPrestamo > hasta) return false
    if (estado === 'pendiente' && p.fechaDevolucion) return false
    if (estado === 'devuelto' && (!p.fechaDevolucion || p.estaAtrasado)) return false
    if (estado === 'atrasado' && !p.estaAtrasado) return false
    return true
  })
}

export function HistorialPrestamosPage() {
  const { data, isLoading, isError } = usePrestamosHistoricos()
  const [buscar, setBuscar] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [estado, setEstado] = useState<FiltroEstado>('todos')

  const hoy = new Date().toISOString().slice(0, 10)

  const filtrados = useMemo(
    () => filtrarPrestamos(data ?? [], buscar, desde, hasta, estado),
    [data, buscar, desde, hasta, estado],
  )

  // Totales para el resumen rápido
  const totalAtrasados = useMemo(
    () => (data ?? []).filter((p) => p.estaAtrasado).length,
    [data],
  )
  const totalPendientes = useMemo(
    () => (data ?? []).filter((p) => !p.fechaDevolucion).length,
    [data],
  )

  function limpiarFiltros() {
    setBuscar('')
    setDesde('')
    setHasta('')
    setEstado('todos')
  }

  if (isLoading) {
    return <p className="text-xl p-8">Cargando historial…</p>
  }

  if (isError) {
    return (
      <Alert>
        No se pudo cargar el historial. Recarga la página o vuelve a intentarlo.
      </Alert>
    )
  }

  return (
    <div className="space-y-7">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Historial de préstamos</h1>
          <p className="text-tinta-suave text-xl">
            Consulta todos los préstamos: en curso, devueltos y atrasados.
          </p>
        </div>
        <Link
          to="/"
          className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-5 text-lg font-bold"
        >
          Volver al inicio
        </Link>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ResumenTarjeta
          titulo="Total de préstamos"
          valor={data?.length ?? 0}
          clases="bg-white border-borde"
        />
        <ResumenTarjeta
          titulo="Préstamos en curso"
          valor={totalPendientes}
          clases="bg-white border-borde"
        />
        <ResumenTarjeta
          titulo="Préstamos atrasados"
          valor={totalAtrasados}
          clases={totalAtrasados > 0 ? 'bg-red-50 border-peligro' : 'bg-white border-borde'}
        />
      </div>

      {/* Filtros */}
      <section className="border-borde space-y-4 rounded-2xl border-2 bg-white p-5">
        <h2 className="text-2xl font-bold">Filtros</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <TextField
            label="Buscar"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Código, título, persona o DNI…"
          />
          <DatePicker
            label="Desde"
            value={desde}
            onChange={setDesde}
            max={hoy}
          />
          <DatePicker
            label="Hasta"
            value={hasta}
            onChange={setHasta}
            max={hoy}
          />
          <Select
            label="Estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value as FiltroEstado)}
          >
            <option value="todos">Todos</option>
            <option value="pendiente">En curso</option>
            <option value="devuelto">Devuelto a tiempo</option>
            <option value="atrasado">Atrasado</option>
          </Select>
        </div>
        <Button variante="secundario" onClick={limpiarFiltros}>
          Limpiar filtros
        </Button>
      </section>

      {/* Contador */}
      <p className="text-tinta-suave">
        {filtrados.length}{' '}
        {filtrados.length === 1 ? 'préstamo encontrado' : 'préstamos encontrados'}.
      </p>

      {/* Tabla o vacío */}
      {filtrados.length === 0 ? (
        <section className="border-borde rounded-2xl border-2 bg-white p-8 text-center">
          <p className="text-xl font-bold">No hay préstamos</p>
          <p className="text-tinta-suave mt-2">Prueba con otros filtros o términos de búsqueda.</p>
        </section>
      ) : (
        <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead className="bg-papel">
              <tr>
                <th className="p-4 text-lg">Código</th>
                <th className="p-4 text-lg">Título</th>
                <th className="p-4 text-lg">Persona</th>
                <th className="p-4 text-lg">DNI</th>
                <th className="p-4 text-lg">Tipo</th>
                <th className="p-4 text-lg">Préstamo</th>
                <th className="p-4 text-lg">Límite</th>
                <th className="p-4 text-lg">Devolución</th>
                <th className="p-4 text-lg">Estado</th>
                <th className="p-4 text-lg">Días de atraso</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr
                  key={p.id}
                  className={`border-borde border-t-2 ${p.estaAtrasado ? 'bg-red-50' : ''}`}
                >
                  <td className="p-4 font-bold">{p.codigo}</td>
                  <td className="p-4">{p.titulo}</td>
                  <td className="p-4">{p.persona}</td>
                  <td className="p-4">{p.dni}</td>
                  <td className="p-4">{p.tipoPersona}</td>
                  <td className="p-4">{formatearFecha(p.fechaPrestamo)}</td>
                  <td className="p-4">{formatearFecha(p.fechaLimite)}</td>
                  <td className="p-4">{formatearFecha(p.fechaDevolucion)}</td>
                  <td className="p-4">
                    <EstadoPrestamoBadge prestamo={p} />
                  </td>
                  <td className="p-4 font-bold">
                    {p.diasAtraso > 0 ? (
                      <span className="text-peligro">{p.diasAtraso} día{p.diasAtraso !== 1 ? 's' : ''}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Tarjeta de estadística pequeña
function ResumenTarjeta({
  titulo,
  valor,
  clases,
}: {
  titulo: string
  valor: number
  clases: string
}) {
  return (
    <div className={`rounded-2xl border-2 p-5 ${clases}`}>
      <p className="text-tinta-suave text-lg">{titulo}</p>
      <p className="text-4xl font-bold">{valor}</p>
    </div>
  )
}
