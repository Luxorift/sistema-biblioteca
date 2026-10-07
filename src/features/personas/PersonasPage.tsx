import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { Select } from '@/components/ui/Select'
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
  const [tipoFiltro, setTipoFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('')
  const [correoFiltro, setCorreoFiltro] = useState('')
  const [confirmar, setConfirmar] = useState<DatosFormulario | null>(null)
  const [nuevoTipo, setNuevoTipo] = useState(false)
  const [nombreTipo, setNombreTipo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const filtradas = useMemo(
    () =>
      (personas.data ?? []).filter((persona) => {
        const termino = buscar.trim().toLowerCase()
        const coincideBusqueda = `${persona.nombres} ${persona.apellidoPaterno} ${persona.apellidoMaterno ?? ''} ${persona.dni} ${persona.correo ?? ''}`
          .toLowerCase()
          .includes(termino)
        const coincideTipo = !tipoFiltro || persona.tipoPersonaId === Number(tipoFiltro)
        const coincideEstado =
          !estadoFiltro ||
          (estadoFiltro === 'activo' ? persona.activo : !persona.activo)
        const coincideCorreo =
          !correoFiltro ||
          (correoFiltro === 'con-correo' ? Boolean(persona.correo) : !persona.correo)

        return (
          coincideBusqueda && coincideTipo && coincideEstado && coincideCorreo
        )
      }),
    [personas.data, buscar, tipoFiltro, estadoFiltro, correoFiltro],
  )
  const limpiarFiltros = () => {
    setBuscar('')
    setTipoFiltro('')
    setEstadoFiltro('')
    setCorreoFiltro('')
  }
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
      <section className="border-borde space-y-5 rounded-2xl border-2 bg-white p-5">
        <h2 className="text-2xl font-bold">Buscar personas</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TextField
            label="Nombre, DNI o correo"
            value={buscar}
            onChange={(evento) => setBuscar(evento.target.value)}
            placeholder="Escribe un dato"
          />
          <Select
            label="Tipo de persona"
            value={tipoFiltro}
            onChange={(evento) => setTipoFiltro(evento.target.value)}
          >
            <option value="">Todos los tipos</option>
            {(tipos.data ?? []).map((tipo) => (
              <option key={tipo.id} value={tipo.id}>
                {tipo.nombre}
              </option>
            ))}
          </Select>
          <Select
            label="Estado"
            value={estadoFiltro}
            onChange={(evento) => setEstadoFiltro(evento.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activas</option>
            <option value="inactivo">Inactivas</option>
          </Select>
          <Select
            label="Correo"
            value={correoFiltro}
            onChange={(evento) => setCorreoFiltro(evento.target.value)}
          >
            <option value="">Con o sin correo</option>
            <option value="con-correo">Con correo</option>
            <option value="sin-correo">Sin correo</option>
          </Select>
        </div>
        <Button variante="secundario" onClick={limpiarFiltros}>
          Limpiar filtros
        </Button>
      </section>
      <section className="space-y-4">
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
