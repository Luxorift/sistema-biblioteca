import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { DatePicker } from '@/components/ui/DatePicker'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { ResumenDevolucion } from './components/ResumenDevolucion'
import type { DevolucionConfirmada, PrestamoPendiente } from './types'
import { usePrestamosPendientes, useRegistrarDevolucion } from './useDevoluciones'

export function DevolverPage() {
  const hoy = new Date().toISOString().slice(0, 10)
  const prestamos = usePrestamosPendientes()
  const registrar = useRegistrarDevolucion()
  const [buscar, setBuscar] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [seleccionado, setSeleccionado] = useState<PrestamoPendiente | null>(null)
  const [fecha, setFecha] = useState(hoy)
  const [error, setError] = useState<string | null>(null)
  const [resumen, setResumen] = useState<DevolucionConfirmada | null>(null)
  const filtrados = useMemo(
    () =>
      (prestamos.data ?? []).filter(
        (prestamo) =>
          `${prestamo.codigo} ${prestamo.titulo} ${prestamo.persona} ${prestamo.dni} ${prestamo.tipoPersona}`
            .toLowerCase()
            .includes(buscar.trim().toLowerCase()) &&
          (!desde || prestamo.fechaPrestamo >= desde) &&
          (!hasta || prestamo.fechaPrestamo <= hasta),
      ),
    [prestamos.data, buscar, desde, hasta],
  )
  const confirmar = (prestamo: PrestamoPendiente) => {
    setSeleccionado(prestamo)
    setFecha(hoy)
    setError(null)
  }
  const devolver = async () => {
    if (!seleccionado) return
    if (fecha < seleccionado.fechaPrestamo || fecha > hoy) {
      setError('La fecha de devolución debe estar entre la fecha de préstamo y hoy.')
      return
    }
    try {
      setResumen(await registrar.mutateAsync({ prestamo: seleccionado, fecha }))
      setSeleccionado(null)
      setError(null)
    } catch {
      setError(
        'No se pudo registrar la devolución. Actualiza la página e intenta de nuevo.',
      )
      setSeleccionado(null)
    }
  }
  if (resumen)
    return <ResumenDevolucion devolucion={resumen} onOtra={() => setResumen(null)} />
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Devolver material</h1>
          <p className="text-tinta-suave text-xl">
            Revisa préstamos pendientes y confirma cuando una copia regrese.
          </p>
        </div>
        <Link
          to="/"
          className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-5 text-lg font-bold"
        >
          Volver al inicio
        </Link>
      </div>
      {error && <Alert>{error}</Alert>}
      {prestamos.isLoading && <p>Cargando préstamos pendientes…</p>}
      {prestamos.isError && (
        <Alert>
          No se pudieron cargar los préstamos. Recarga la página e intenta de nuevo.
        </Alert>
      )}
      {prestamos.isSuccess && (
        <>
          <section className="border-borde space-y-4 rounded-2xl border-2 bg-white p-5">
            <h2 className="text-2xl font-bold">Filtros</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <TextField
                label="Material, código, persona o DNI"
                value={buscar}
                onChange={(evento) => setBuscar(evento.target.value)}
                placeholder="Por ejemplo: BIB-000001 o Juan"
              />
              <DatePicker
                label="Préstamos desde"
                value={desde}
                onChange={setDesde}
                max={hoy}
              />
              <DatePicker
                label="Préstamos hasta"
                value={hasta}
                onChange={setHasta}
                max={hoy}
              />
            </div>
            <Button
              variante="secundario"
              onClick={() => {
                setBuscar('')
                setDesde('')
                setHasta('')
              }}
            >
              Limpiar filtros
            </Button>
          </section>
          <p className="text-tinta-suave">
            {filtrados.length}{' '}
            {filtrados.length === 1 ? 'préstamo pendiente' : 'préstamos pendientes'}.
          </p>
          {filtrados.length ? (
            <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
              <table className="w-full min-w-[1150px] border-collapse text-left">
                <thead className="bg-papel">
                  <tr>
                    <th className="p-4">Código</th>
                    <th className="p-4">Material</th>
                    <th className="p-4">Persona</th>
                    <th className="p-4">DNI</th>
                    <th className="p-4">Préstamo</th>
                    <th className="p-4">Límite</th>
                    <th className="p-4">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((prestamo) => (
                    <tr key={prestamo.id} className="border-borde border-t-2">
                      <td className="p-4 font-bold">{prestamo.codigo}</td>
                      <td className="p-4">{prestamo.titulo}</td>
                      <td className="p-4">{prestamo.persona}</td>
                      <td className="p-4">{prestamo.dni}</td>
                      <td className="p-4">{prestamo.fechaPrestamo}</td>
                      <td className="p-4">
                        {prestamo.fechaLimite ?? 'Sin fecha límite'}
                      </td>
                      <td className="p-4">
                        <Button variante="secundario" onClick={() => confirmar(prestamo)}>
                          Registrar devolución
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <section className="border-borde rounded-2xl border-2 bg-white p-5">
              <h2 className="text-2xl font-bold">No hay préstamos pendientes</h2>
              <p>No hay copias por devolver con los filtros actuales.</p>
            </section>
          )}
        </>
      )}
      <Dialog
        abierto={Boolean(seleccionado)}
        titulo="Confirmar devolución"
        onCerrar={() => setSeleccionado(null)}
      >
        {seleccionado && (
          <div className="space-y-5">
            <p>
              Vas a marcar como devuelta la copia <strong>{seleccionado.codigo}</strong>{' '}
              de <strong>{seleccionado.titulo}</strong>.
            </p>
            <DatePicker
              label="Fecha de devolución"
              value={fecha}
              onChange={setFecha}
              min={seleccionado.fechaPrestamo}
              max={hoy}
            />
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void devolver()} disabled={registrar.isPending}>
                {registrar.isPending ? 'Guardando…' : 'Sí, registrar devolución'}
              </Button>
              <Button variante="secundario" onClick={() => setSeleccionado(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
