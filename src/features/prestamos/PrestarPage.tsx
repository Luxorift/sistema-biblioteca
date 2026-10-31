import { fechaBiblioteca } from '@/lib/fechas'
import { ArrowLeft } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { IndicadorCarga } from '@/components/feedback'
import { TextField } from '@/components/ui/TextField'
import { PasosFlujo } from '@/components/ui/PasosFlujo'
import { irAlPaso } from '@/lib/guiarNavegacion'
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

interface PrestarPageProps {
  ocultarEncabezado?: boolean
  personaInicial?: PersonaPrestataria
}

export function PrestarPage({
  ocultarEncabezado = false,
  personaInicial,
}: PrestarPageProps) {
  const materialesRef = useRef<HTMLElement>(null)
  const personasRef = useRef<HTMLElement>(null)
  const copiasRef = useRef<HTMLElement>(null)
  const fechasRef = useRef<HTMLElement>(null)
  const resultadoRef = useRef<HTMLElement>(null)
  const mensajesRef = useRef<HTMLElement>(null)
  const hoy = fechaBiblioteca()
  const formulario = useForm<DatosFormulario>({
    resolver: zodResolver(esquemaPrestamo),
    defaultValues: {
      ejemplarIds: [],
      cantidad: 1,
      personaId: personaInicial?.id ?? 0,
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
  const [copiasSeleccionadas, setCopiasSeleccionadas] = useState<CopiaDisponible[]>([])
  const [personaSeleccionada, setPersonaSeleccionada] =
    useState<PersonaPrestataria | null>(personaInicial ?? null)
  const [confirmar, setConfirmar] = useState<DatosFormulario | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resumen, setResumen] = useState<PrestamoConfirmado | null>(null)
  const cantidad = useWatch({ control: formulario.control, name: 'cantidad' })
  const copiasCompletas =
    copiasSeleccionadas.length > 0 && copiasSeleccionadas.length === cantidad
  const pasoActual = !materialSeleccionado
    ? 0
    : !personaSeleccionada
      ? 1
      : !copiasCompletas
        ? 2
        : 3
  const siguientes = [
    'Elige el material que vas a prestar.',
    'Elige a la persona que recibirá el material.',
    'Indica la cantidad y elige los códigos de las copias.',
    'Revisa las fechas y pulsa Revisar préstamo.',
  ]
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
    if (materialSeleccionado?.id === material.id) {
      irAlPaso(personaSeleccionada ? copiasRef : personasRef)
      return
    }
    setMaterialSeleccionado(material)
    setCopiasSeleccionadas([])
    formulario.setValue('ejemplarIds', [])
    irAlPaso(personaSeleccionada ? copiasRef : personasRef)
  }
  const guardar = async (datos: DatosFormulario) => {
    if (!copiasSeleccionadas.length || !personaSeleccionada) {
      setError('Elige una copia y una persona antes de continuar.')
      setConfirmar(null)
      irAlPaso(mensajesRef)
      return
    }
    setError(null)
    try {
      setResumen(
        await registrar.mutateAsync({
          datos,
          copias: copiasSeleccionadas,
          persona: personaSeleccionada,
        }),
      )
      setConfirmar(null)
      irAlPaso(resultadoRef)
    } catch {
      setError(
        'No se pudo registrar el préstamo. La copia pudo haber sido prestada por otra persona. Actualiza e intenta de nuevo.',
      )
      setConfirmar(null)
      irAlPaso(mensajesRef)
    }
  }
  const reiniciar = () => {
    formulario.reset({
      ejemplarIds: [],
      cantidad: 1,
      personaId: 0,
      fechaPrestamo: hoy,
      tieneFechaLimite: false,
      fechaLimite: '',
    })
    setMaterialSeleccionado(null)
    setCopiasSeleccionadas([])
    setPersonaSeleccionada(null)
    setResumen(null)
    irAlPaso(materialesRef)
  }
  if (resumen)
    return (
      <section ref={resultadoRef} tabIndex={-1} className="destino-flujo">
        <ResumenPrestamo prestamo={resumen} onOtro={reiniciar} />
      </section>
    )
  return (
    <div className="space-y-7">
      {!ocultarEncabezado && (
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Prestar material</h1>
            <p className="text-tinta-suave text-xl">
              Elige un material, una copia y la persona que lo recibirá.
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
      )}
      <PasosFlujo
        pasoActual={pasoActual}
        siguiente={siguientes[pasoActual]}
        pasos={[
          {
            titulo: 'Material',
            completado: Boolean(materialSeleccionado),
            onIr: () => irAlPaso(materialesRef),
          },
          {
            titulo: 'Persona',
            completado: Boolean(personaSeleccionada),
            onIr: () => irAlPaso(personasRef),
          },
          {
            titulo: 'Copias',
            completado: copiasCompletas,
            habilitado: Boolean(materialSeleccionado),
            onIr: () => irAlPaso(copiasRef),
          },
          {
            titulo: 'Fechas y revisión',
            completado: false,
            habilitado: copiasCompletas && Boolean(personaSeleccionada),
            onIr: () => irAlPaso(fechasRef),
          },
        ]}
      />
      {error && (
        <section ref={mensajesRef} tabIndex={-1} className="destino-flujo">
          <Alert>{error}</Alert>
        </section>
      )}
      {(materiales.isError || personas.isError) && (
        <Alert>
          No se pudieron cargar materiales o personas. Recarga la página e intenta de
          nuevo.
        </Alert>
      )}
      {materiales.isLoading || personas.isLoading ? (
        <IndicadorCarga
          mensaje="Cargando materiales y personas…"
          subtexto="Obteniendo la lista de copias disponibles y las personas autorizadas."
        />
      ) : (
        <>
          <section
            ref={materialesRef}
            tabIndex={-1}
            className="destino-flujo space-y-4"
            aria-label="Elegir material"
          >
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
                          variante={
                            materialSeleccionado?.id === material.id
                              ? 'primario'
                              : 'secundario'
                          }
                          aria-pressed={materialSeleccionado?.id === material.id}
                          onClick={() => elegirMaterial(material)}
                        >
                          {materialSeleccionado?.id === material.id
                            ? 'Material elegido'
                            : 'Elegir este material'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {materialesFiltrados.length === 0 && (
              <p role="status">
                No hay materiales disponibles con ese filtro.{' '}
                <Link className="text-primario font-bold underline" to="/materiales">
                  Revisar el inventario
                </Link>
              </p>
            )}
          </section>
          <section
            ref={personasRef}
            tabIndex={-1}
            className="destino-flujo space-y-4"
            aria-label="Elegir persona"
          >
            <h2 className="text-2xl font-bold">2. Personas registradas</h2>
            {materialSeleccionado && (
              <p className="text-tinta-suave">
                Material elegido: <strong>{materialSeleccionado.titulo}</strong>. Ahora
                selecciona quién lo recibirá.
              </p>
            )}
            <TextField
              label="Filtrar personas"
              value={filtroPersona}
              onChange={(evento) => setFiltroPersona(evento.target.value)}
              placeholder="Nombre, DNI o tipo"
            />
            <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
              <table className="w-full min-w-160 border-collapse text-left">
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
                          variante={
                            personaSeleccionada?.id === persona.id
                              ? 'primario'
                              : 'secundario'
                          }
                          aria-pressed={personaSeleccionada?.id === persona.id}
                          onClick={() => {
                            setPersonaSeleccionada(persona)
                            formulario.setValue('personaId', persona.id, {
                              shouldValidate: true,
                            })
                            irAlPaso(
                              !materialSeleccionado
                                ? materialesRef
                                : copiasCompletas
                                  ? fechasRef
                                  : copiasRef,
                            )
                          }}
                        >
                          {personaSeleccionada?.id === persona.id
                            ? 'Persona elegida'
                            : 'Elegir esta persona'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {personasFiltradas.length === 0 && (
              <p role="status">
                No se encontraron personas activas con ese dato.{' '}
                <Link className="text-primario font-bold underline" to="/personas">
                  Registrar o revisar personas
                </Link>
              </p>
            )}
          </section>
          <section className="border-borde rounded-2xl border-2 bg-white p-5">
            <FormularioPrestamo
              referenciaCopias={copiasRef}
              referenciaFechas={fechasRef}
              onInvalido={() =>
                irAlPaso(
                  !materialSeleccionado
                    ? materialesRef
                    : !personaSeleccionada
                      ? personasRef
                      : !copiasCompletas
                        ? copiasRef
                        : fechasRef,
                )
              }
              formulario={formulario}
              copias={materialSeleccionado?.copias ?? []}
              copiasSeleccionadas={copiasSeleccionadas}
              personaSeleccionada={personaSeleccionada}
              onAlternarCopia={(copia) => {
                const yaSeleccionada = copiasSeleccionadas.some(
                  (fila) => fila.id === copia.id,
                )
                const nuevas = yaSeleccionada
                  ? copiasSeleccionadas.filter((fila) => fila.id !== copia.id)
                  : [...copiasSeleccionadas, copia]
                setCopiasSeleccionadas(nuevas)
                formulario.setValue(
                  'ejemplarIds',
                  nuevas.map((fila) => fila.id),
                  { shouldValidate: true },
                )
                if (!yaSeleccionada && nuevas.length === formulario.getValues('cantidad'))
                  irAlPaso(personaSeleccionada ? fechasRef : personasRef)
              }}
              onQuitarMaterial={() => {
                setMaterialSeleccionado(null)
                setCopiasSeleccionadas([])
                formulario.setValue('ejemplarIds', [], { shouldValidate: true })
                irAlPaso(materialesRef)
              }}
              onQuitarPersona={() => {
                setPersonaSeleccionada(null)
                formulario.setValue('personaId', 0, { shouldValidate: true })
                irAlPaso(personasRef)
              }}
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
              Vas a prestar {copiasSeleccionadas.length}{' '}
              {copiasSeleccionadas.length === 1 ? 'copia' : 'copias'} de{' '}
              <strong>{materialSeleccionado?.titulo}</strong> a{' '}
              <strong>{personaSeleccionada?.nombreCompleto}</strong>. Revisa estos datos
              antes de confirmar.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                disabled={registrar.isPending}
                onClick={() => void guardar(confirmar)}
              >
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
