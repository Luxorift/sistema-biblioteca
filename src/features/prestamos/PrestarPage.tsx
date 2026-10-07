import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { FormularioPrestamo } from './components/FormularioPrestamo'
import { ResumenPrestamo } from './components/ResumenPrestamo'
import { esquemaPrestamo, type FormularioPrestamo as DatosFormulario } from './schemas'
import {
  useCopiasDisponibles,
  usePersonasActivas,
  useRegistrarPrestamo,
} from './usePrestamos'
import type { CopiaDisponible, PersonaPrestataria, PrestamoConfirmado } from './types'

export function PrestarPage() {
  const formulario = useForm<DatosFormulario>({
    resolver: zodResolver(esquemaPrestamo),
    defaultValues: {
      ejemplarId: 0,
      personaId: 0,
      fechaPrestamo: new Date().toISOString().slice(0, 10),
      tieneFechaLimite: false,
      fechaLimite: '',
    },
  })
  const copias = useCopiasDisponibles()
  const personas = usePersonasActivas()
  const registrar = useRegistrarPrestamo()
  const [buscarCopia, setBuscarCopia] = useState('')
  const [buscarPersona, setBuscarPersona] = useState('')
  const [copiaSeleccionada, setCopiaSeleccionada] = useState<CopiaDisponible | null>(null)
  const [personaSeleccionada, setPersonaSeleccionada] =
    useState<PersonaPrestataria | null>(null)
  const [confirmar, setConfirmar] = useState<DatosFormulario | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resumen, setResumen] = useState<PrestamoConfirmado | null>(null)
  const copiasFiltradas = useMemo(
    () =>
      (copias.data ?? []).filter((copia) =>
        `${copia.codigo} ${copia.titulo}`
          .toLowerCase()
          .includes(buscarCopia.toLowerCase()),
      ),
    [copias.data, buscarCopia],
  )
  const personasFiltradas = useMemo(
    () =>
      (personas.data ?? []).filter((persona) =>
        `${persona.nombreCompleto} ${persona.dni}`
          .toLowerCase()
          .includes(buscarPersona.toLowerCase()),
      ),
    [personas.data, buscarPersona],
  )
  const guardar = async (datos: DatosFormulario) => {
    const copia = (copias.data ?? []).find((fila) => fila.id === datos.ejemplarId)
    const persona = (personas.data ?? []).find((fila) => fila.id === datos.personaId)
    if (!copia || !persona) {
      setError(
        'La copia o la persona ya no está disponible. Actualiza la pantalla e intenta de nuevo.',
      )
      setConfirmar(null)
      return
    }
    setError(null)
    try {
      setResumen(await registrar.mutateAsync({ datos, copia, persona }))
      setConfirmar(null)
    } catch {
      setError(
        'No se pudo registrar el préstamo. Verifica que la copia siga disponible e intenta de nuevo.',
      )
      setConfirmar(null)
    }
  }
  const reiniciar = () => {
    formulario.reset()
    setResumen(null)
    setBuscarCopia('')
    setBuscarPersona('')
    setCopiaSeleccionada(null)
    setPersonaSeleccionada(null)
  }
  if (resumen) return <ResumenPrestamo prestamo={resumen} onOtro={reiniciar} />
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prestar material</h1>
          <p className="text-tinta-suave text-xl">
            Elige una copia disponible y la persona que la recibirá.
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
      {(copias.isError || personas.isError) && (
        <Alert>
          No se pudieron cargar las copias o las personas. Recarga la página e intenta de
          nuevo.
        </Alert>
      )}
      {copias.isLoading || personas.isLoading ? (
        <p>Cargando datos para el préstamo…</p>
      ) : (
        <section className="border-borde space-y-6 rounded-2xl border-2 bg-white p-5">
          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              label="Filtrar copias"
              value={buscarCopia}
              onChange={(evento) => setBuscarCopia(evento.target.value)}
              placeholder="Código o título"
            />
            <TextField
              label="Filtrar personas"
              value={buscarPersona}
              onChange={(evento) => setBuscarPersona(evento.target.value)}
              placeholder="Nombre o DNI"
            />
          </div>
          {!copiasFiltradas.length && (
            <Alert>No hay copias disponibles para prestar.</Alert>
          )}
          {!personasFiltradas.length && (
            <Alert>No hay personas activas. Registra una antes de prestar.</Alert>
          )}
          <FormularioPrestamo
            formulario={formulario}
            copias={buscarCopia.trim() ? copiasFiltradas : []}
            personas={buscarPersona.trim() ? personasFiltradas : []}
            copiaSeleccionada={copiaSeleccionada}
            personaSeleccionada={personaSeleccionada}
            onElegirCopia={(copia) => {
              setCopiaSeleccionada(copia)
              formulario.setValue('ejemplarId', copia.id, { shouldValidate: true })
            }}
            onElegirPersona={(persona) => {
              setPersonaSeleccionada(persona)
              formulario.setValue('personaId', persona.id, { shouldValidate: true })
            }}
            onEnviar={setConfirmar}
            guardando={registrar.isPending}
          />
        </section>
      )}
      <Dialog
        abierto={Boolean(confirmar)}
        titulo="Confirmar préstamo"
        onCerrar={() => setConfirmar(null)}
      >
        {confirmar && (
          <div className="space-y-5">
            <p>¿Confirmas entregar esta copia? Después quedará marcada como prestada.</p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void guardar(confirmar)}>
                Sí, registrar préstamo
              </Button>
              <Button variante="secundario" onClick={() => setConfirmar(null)}>
                Seguir revisando
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  )
}
