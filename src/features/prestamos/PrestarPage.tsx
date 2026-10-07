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
  useMaterialesPrestables,
  usePersonasActivas,
  useRegistrarPrestamo,
} from './usePrestamos'
import type {
  CopiaDisponible,
  MaterialPrestable,
  PersonaPrestataria,
  PrestamoConfirmado,
} from './types'

export function PrestarPage() {
  const hoy = new Date().toISOString().slice(0, 10)
  const formulario = useForm<DatosFormulario>({
    resolver: zodResolver(esquemaPrestamo),
    defaultValues: {
      ejemplarId: 0,
      personaId: 0,
      fechaPrestamo: hoy,
      tieneFechaLimite: false,
      fechaLimite: '',
    },
  })
  const materiales = useMaterialesPrestables()
  const personas = usePersonasActivas()
  const registrar = useRegistrarPrestamo()
  const [filtroMaterial, setFiltroMaterial] = useState('')
  const [filtroPersona, setFiltroPersona] = useState('')
  const [materialSeleccionado, setMaterialSeleccionado] =
    useState<MaterialPrestable | null>(null)
  const [copiaSeleccionada, setCopiaSeleccionada] = useState<CopiaDisponible | null>(null)
  const [personaSeleccionada, setPersonaSeleccionada] =
    useState<PersonaPrestataria | null>(null)
  const [confirmar, setConfirmar] = useState<DatosFormulario | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resumen, setResumen] = useState<PrestamoConfirmado | null>(null)
  const materialesFiltrados = useMemo(
    () =>
      (materiales.data ?? []).filter((material) =>
        `${material.titulo} ${material.autores.join(' ')} ${material.editorial ?? ''} ${material.tipo} ${material.anio ?? ''}`
          .toLowerCase()
          .includes(filtroMaterial.toLowerCase()),
      ),
    [materiales.data, filtroMaterial],
  )
  const personasFiltradas = useMemo(
    () =>
      (personas.data ?? []).filter((persona) =>
        `${persona.nombreCompleto} ${persona.dni} ${persona.tipo}`
          .toLowerCase()
          .includes(filtroPersona.toLowerCase()),
      ),
    [personas.data, filtroPersona],
  )
  const elegirMaterial = (material: MaterialPrestable) => {
    setMaterialSeleccionado(material)
    setCopiaSeleccionada(null)
    formulario.setValue('ejemplarId', 0)
  }
  const guardar = async (datos: DatosFormulario) => {
    if (!copiaSeleccionada || !personaSeleccionada) {
      setError('Elige una copia y una persona antes de continuar.')
      setConfirmar(null)
      return
    }
    setError(null)
    try {
      setResumen(
        await registrar.mutateAsync({
          datos,
          copia: copiaSeleccionada,
          persona: personaSeleccionada,
        }),
      )
      setConfirmar(null)
    } catch {
      setError(
        'No se pudo registrar el préstamo. La copia pudo haber sido prestada por otra persona. Actualiza e intenta de nuevo.',
      )
      setConfirmar(null)
    }
  }
  const reiniciar = () => {
    formulario.reset({
      ejemplarId: 0,
      personaId: 0,
      fechaPrestamo: hoy,
      tieneFechaLimite: false,
      fechaLimite: '',
    })
    setMaterialSeleccionado(null)
    setCopiaSeleccionada(null)
    setPersonaSeleccionada(null)
    setResumen(null)
  }
  if (resumen) return <ResumenPrestamo prestamo={resumen} onOtro={reiniciar} />
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Prestar material</h1>
          <p className="text-tinta-suave text-xl">
            Elige un material, una copia y la persona que lo recibirá.
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
      {(materiales.isError || personas.isError) && (
        <Alert>
          No se pudieron cargar materiales o personas. Recarga la página e intenta de
          nuevo.
        </Alert>
      )}
      {materiales.isLoading || personas.isLoading ? (
        <p>Cargando datos para el préstamo…</p>
      ) : (
        <>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">1. Materiales disponibles</h2>
            <TextField
              label="Filtrar materiales"
              value={filtroMaterial}
              onChange={(evento) => setFiltroMaterial(evento.target.value)}
              placeholder="Título, autor, editorial, tipo o año"
            />
            <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
              <table className="w-full min-w-[1050px] border-collapse text-left">
                <thead className="bg-papel">
                  <tr>
                    <th className="p-4">Título</th>
                    <th className="p-4">Autor</th>
                    <th className="p-4">Editorial</th>
                    <th className="p-4">Año</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Copias</th>
                    <th className="p-4">Disponibles</th>
                    <th className="p-4">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {materialesFiltrados.map((material) => (
                    <tr key={material.id} className="border-borde border-t-2">
                      <td className="p-4 font-bold">{material.titulo}</td>
                      <td className="p-4">{material.autores.join(', ') || '—'}</td>
                      <td className="p-4">{material.editorial ?? '—'}</td>
                      <td className="p-4">{material.anio ?? '—'}</td>
                      <td className="p-4">{material.tipo}</td>
                      <td className="p-4">{material.cantidadCopias}</td>
                      <td className="p-4">{material.copias.length}</td>
                      <td className="p-4">
                        <Button
                          variante="secundario"
                          onClick={() => elegirMaterial(material)}
                        >
                          Elegir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">2. Personas registradas</h2>
            <TextField
              label="Filtrar personas"
              value={filtroPersona}
              onChange={(evento) => setFiltroPersona(evento.target.value)}
              placeholder="Nombre, DNI o tipo"
            />
            <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead className="bg-papel">
                  <tr>
                    <th className="p-4">Persona</th>
                    <th className="p-4">DNI</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {personasFiltradas.map((persona) => (
                    <tr key={persona.id} className="border-borde border-t-2">
                      <td className="p-4 font-bold">{persona.nombreCompleto}</td>
                      <td className="p-4">{persona.dni}</td>
                      <td className="p-4">{persona.tipo}</td>
                      <td className="p-4">
                        <Button
                          variante="secundario"
                          onClick={() => {
                            setPersonaSeleccionada(persona)
                            formulario.setValue('personaId', persona.id, {
                              shouldValidate: true,
                            })
                          }}
                        >
                          Elegir
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="border-borde rounded-2xl border-2 bg-white p-5">
            <FormularioPrestamo
              formulario={formulario}
              copias={materialSeleccionado?.copias ?? []}
              personas={[]}
              copiaSeleccionada={copiaSeleccionada}
              personaSeleccionada={personaSeleccionada}
              onElegirCopia={(copia) => {
                setCopiaSeleccionada(copia)
                formulario.setValue('ejemplarId', copia.id, { shouldValidate: true })
              }}
              onElegirPersona={() => undefined}
              onEnviar={setConfirmar}
              guardando={registrar.isPending}
            />
          </section>
        </>
      )}
      <Dialog
        abierto={Boolean(confirmar)}
        titulo="Confirmar préstamo"
        onCerrar={() => setConfirmar(null)}
      >
        {confirmar && (
          <div className="space-y-5">
            <p>
              ¿Confirmas registrar el préstamo? La copia quedará marcada como prestada.
            </p>
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
