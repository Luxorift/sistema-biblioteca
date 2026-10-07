import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { FormularioPersona } from './components/FormularioPersona'
import { TablaPersonas } from './components/TablaPersonas'
import { esquemaPersona, type FormularioPersona as DatosFormulario } from './schemas'
import {
  useCrearPersona,
  useCrearTipoPersona,
  usePersonas,
  useTiposPersona,
} from './usePersonas'

export function PersonasPage() {
  const formulario = useForm<DatosFormulario>({
    resolver: zodResolver(esquemaPersona),
    defaultValues: {
      tipoPersonaId: 0,
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      dni: '',
      correo: '',
    },
  })
  const personas = usePersonas()
  const tipos = useTiposPersona()
  const crearPersona = useCrearPersona()
  const crearTipo = useCrearTipoPersona()
  const [buscar, setBuscar] = useState('')
  const [confirmar, setConfirmar] = useState<DatosFormulario | null>(null)
  const [nuevoTipo, setNuevoTipo] = useState(false)
  const [nombreTipo, setNombreTipo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const filtradas = useMemo(
    () =>
      (personas.data ?? []).filter((persona) =>
        `${persona.nombres} ${persona.apellidoPaterno} ${persona.apellidoMaterno ?? ''} ${persona.dni}`
          .toLowerCase()
          .includes(buscar.trim().toLowerCase()),
      ),
    [personas.data, buscar],
  )
  const guardar = async (datos: DatosFormulario) => {
    setError(null)
    try {
      await crearPersona.mutateAsync(datos)
      formulario.reset()
      setConfirmar(null)
    } catch {
      setError(
        'No se pudo guardar. Revisa que el DNI no esté registrado e intenta de nuevo.',
      )
    }
  }
  const guardarTipo = async () => {
    setError(null)
    try {
      if (!nombreTipo.trim()) {
        setError('Escribe el tipo de persona.')
        return
      }
      const tipo = await crearTipo.mutateAsync(nombreTipo)
      formulario.setValue('tipoPersonaId', tipo.id)
      setNombreTipo('')
      setNuevoTipo(false)
    } catch {
      setError('No se pudo guardar el tipo. Puede que ya exista.')
    }
  }
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Personas</h1>
          <p className="text-tinta-suave text-xl">
            Registra a quien recibirá materiales de la biblioteca.
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
      <section className="border-borde space-y-5 rounded-2xl border-2 bg-white p-5">
        <h2 className="text-2xl font-bold">Registrar persona</h2>
        <FormularioPersona
          formulario={formulario}
          tipos={tipos.data ?? []}
          guardando={crearPersona.isPending}
          onNuevoTipo={() => setNuevoTipo(true)}
          onEnviar={setConfirmar}
        />
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Buscar personas</h2>
        <TextField
          label="Buscar por nombre o DNI"
          value={buscar}
          onChange={(evento) => setBuscar(evento.target.value)}
          placeholder="Escribe un nombre o DNI"
        />
        {personas.isLoading && <p>Cargando personas…</p>}
        {personas.isError && (
          <Alert>
            No se pudieron cargar las personas. Recarga la página e intenta de nuevo.
          </Alert>
        )}
        {personas.isSuccess &&
          (filtradas.length ? (
            <TablaPersonas personas={filtradas} />
          ) : (
            <p className="border-borde rounded-xl border-2 bg-white p-4">
              No hay personas registradas con ese dato.
            </p>
          ))}
      </section>
      <Dialog
        abierto={Boolean(confirmar)}
        titulo="Confirmar registro"
        onCerrar={() => setConfirmar(null)}
      >
        {confirmar && (
          <div className="space-y-5">
            <p>
              Vas a registrar a{' '}
              <strong>
                {confirmar.nombres} {confirmar.apellidoPaterno}
              </strong>{' '}
              con DNI <strong>{confirmar.dni}</strong>.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => void guardar(confirmar)}>Sí, guardar</Button>
              <Button variante="secundario" onClick={() => setConfirmar(null)}>
                Seguir revisando
              </Button>
            </div>
          </div>
        )}
      </Dialog>
      <Dialog
        abierto={nuevoTipo}
        titulo="Agregar tipo de persona"
        onCerrar={() => setNuevoTipo(false)}
      >
        <div className="space-y-5">
          <TextField
            label="Tipo de persona"
            value={nombreTipo}
            onChange={(evento) => setNombreTipo(evento.target.value)}
            autoFocus
          />
          <Button onClick={() => void guardarTipo()} disabled={crearTipo.isPending}>
            {crearTipo.isPending ? 'Guardando…' : 'Guardar tipo'}
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
