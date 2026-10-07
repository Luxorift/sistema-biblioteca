import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { ConfirmarEliminarDialog } from './components/ConfirmarEliminarDialog'
import { CrearEditarCatalogoDialog } from './components/CrearEditarCatalogoDialog'
import { CrearEditarUbicacionDialog } from './components/CrearEditarUbicacionDialog'
import { TablaCatalogoSimple } from './components/TablaCatalogoSimple'
import { TablaUbicaciones } from './components/TablaUbicaciones'
import {
  CATALOGOS_DISPONIBLES,
  type CatalogoSeccion,
  type OpcionCatalogo,
  type TipoCatalogoSimple,
  type Ubicacion,
} from './types'
import {
  useCatalogoSimple,
  useEliminarCatalogoSimple,
  useEliminarUbicacion,
  useUbicaciones,
} from './useCatalogos'

export function CatalogosPage() {
  const [seccionActiva, setSeccionActiva] = useState<CatalogoSeccion>('tipos_material')
  const [mensajeExito, setMensajeExito] = useState<string | null>(null)

  // Modales de creación/edición
  const [modalSimpleAbierto, setModalSimpleAbierto] = useState(false)
  const [elementoParaEditar, setElementoParaEditar] = useState<OpcionCatalogo | null>(null)

  const [modalUbicacionAbierto, setModalUbicacionAbierto] = useState(false)
  const [ubicacionParaEditar, setUbicacionParaEditar] = useState<Ubicacion | null>(null)

  // Modal de eliminación
  const [elementoParaEliminar, setElementoParaEliminar] = useState<{
    tipo: 'simple' | 'ubicacion'
    id: number
    nombre: string
  } | null>(null)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  const metaActual =
    CATALOGOS_DISPONIBLES.find((c) => c.id === seccionActiva) ?? CATALOGOS_DISPONIBLES[0]

  // Consultas de datos según el tipo
  const consultaSimple = useCatalogoSimple(
    seccionActiva !== 'ubicaciones' ? (seccionActiva as TipoCatalogoSimple) : 'tipos_material',
  )
  const consultaUbicaciones = useUbicaciones()

  // Mutaciones de eliminación
  const eliminarSimpleMutation = useEliminarCatalogoSimple(
    seccionActiva !== 'ubicaciones' ? (seccionActiva as TipoCatalogoSimple) : 'tipos_material',
  )
  const eliminarUbicacionMutation = useEliminarUbicacion()

  const mostrarExito = (texto: string) => {
    setMensajeExito(texto)
    setTimeout(() => setMensajeExito(null), 5000)
  }

  const abrirCreacion = () => {
    if (seccionActiva === 'ubicaciones') {
      setUbicacionParaEditar(null)
      setModalUbicacionAbierto(true)
    } else {
      setElementoParaEditar(null)
      setModalSimpleAbierto(true)
    }
  }

  const abrirEdicionSimple = (item: OpcionCatalogo) => {
    setElementoParaEditar(item)
    setModalSimpleAbierto(true)
  }

  const abrirEdicionUbicacion = (item: Ubicacion) => {
    setUbicacionParaEditar(item)
    setModalUbicacionAbierto(true)
  }

  const abrirConfirmarEliminarSimple = (item: OpcionCatalogo) => {
    setErrorEliminar(null)
    setElementoParaEliminar({
      tipo: 'simple',
      id: item.id,
      nombre: item.nombre,
    })
  }

  const abrirConfirmarEliminarUbicacion = (item: Ubicacion) => {
    setErrorEliminar(null)
    setElementoParaEliminar({
      tipo: 'ubicacion',
      id: item.id,
      nombre: `Estante ${item.estante}, Nivel ${item.nivel}`,
    })
  }

  const ejecutarEliminacion = async () => {
    if (!elementoParaEliminar) return
    setErrorEliminar(null)
    try {
      if (elementoParaEliminar.tipo === 'ubicacion') {
        await eliminarUbicacionMutation.mutateAsync(elementoParaEliminar.id)
        mostrarExito('La ubicación fue eliminada exitosamente.')
      } else {
        await eliminarSimpleMutation.mutateAsync(elementoParaEliminar.id)
        mostrarExito(`Se eliminó "${elementoParaEliminar.nombre}" del catálogo.`)
      }
      setElementoParaEliminar(null)
    } catch (err) {
      setErrorEliminar(err instanceof Error ? err.message : 'Error al eliminar el registro.')
    }
  }

  const estaCargando =
    seccionActiva === 'ubicaciones'
      ? consultaUbicaciones.isLoading
      : consultaSimple.isLoading

  const tieneError =
    seccionActiva === 'ubicaciones'
      ? consultaUbicaciones.isError
      : consultaSimple.isError

  const errorMensaje =
    seccionActiva === 'ubicaciones'
      ? consultaUbicaciones.error?.message
      : consultaSimple.error?.message

  return (
    <div className="space-y-7">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Catálogos de la biblioteca</h1>
          <p className="text-tinta-suave text-xl">
            Gestiona los tipos de libros, categorías temáticas, editoriales, autores y estantes.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-5 text-lg font-bold"
          >
            Volver al inicio
          </Link>
          <Button onClick={abrirCreacion}>
            <Plus aria-hidden size={22} />
            Agregar nuevo {metaActual.singular}
          </Button>
        </div>
      </div>

      {mensajeExito && (
        <div className="rounded-xl border-2 border-green-500 bg-green-50 p-4 text-green-900 font-bold text-lg">
          {mensajeExito}
        </div>
      )}

      {/* Pestañas de selección de catálogo */}
      <nav
        aria-label="Selección de catálogo"
        className="flex flex-wrap gap-2 border-b-2 border-borde pb-3"
      >
        {CATALOGOS_DISPONIBLES.map((cat) => {
          const esActiva = cat.id === seccionActiva
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSeccionActiva(cat.id)
                setErrorEliminar(null)
              }}
              aria-current={esActiva ? 'page' : undefined}
              className={`min-h-12 rounded-xl px-4 py-2 text-lg font-bold transition-colors ${
                esActiva
                  ? 'bg-primario text-white'
                  : 'bg-white text-tinta border-2 border-borde hover:bg-papel'
              }`}
            >
              {cat.titulo}
            </button>
          )
        })}
      </nav>

      {/* Descripción del catálogo activo */}
      <section className="rounded-2xl border-2 border-borde bg-white p-5 space-y-4">
        <div>
          <h2 className="text-2xl font-bold">{metaActual.titulo}</h2>
          <p className="text-tinta-suave text-lg mt-1">{metaActual.descripcion}</p>
        </div>

        {tieneError && (
          <Alert>
            {errorMensaje || 'No se pudieron cargar los datos del catálogo. Recarga la página.'}
          </Alert>
        )}

        {estaCargando ? (
          <p className="text-xl p-6">Cargando registros…</p>
        ) : seccionActiva === 'ubicaciones' ? (
          <TablaUbicaciones
            ubicaciones={consultaUbicaciones.data ?? []}
            onEditar={abrirEdicionUbicacion}
            onEliminar={abrirConfirmarEliminarUbicacion}
          />
        ) : (
          <TablaCatalogoSimple
            elementos={consultaSimple.data ?? []}
            meta={metaActual}
            onEditar={abrirEdicionSimple}
            onEliminar={abrirConfirmarEliminarSimple}
          />
        )}
      </section>

      {/* Diálogos modales */}
      {seccionActiva !== 'ubicaciones' && (
        <CrearEditarCatalogoDialog
          abierto={modalSimpleAbierto}
          onCerrar={() => setModalSimpleAbierto(false)}
          meta={metaActual}
          elementoParaEditar={elementoParaEditar}
          onExito={mostrarExito}
        />
      )}

      <CrearEditarUbicacionDialog
        abierto={modalUbicacionAbierto}
        onCerrar={() => setModalUbicacionAbierto(false)}
        ubicacionParaEditar={ubicacionParaEditar}
        onExito={mostrarExito}
      />

      <ConfirmarEliminarDialog
        abierto={Boolean(elementoParaEliminar)}
        titulo={`Eliminar ${metaActual.singular}`}
        mensaje={`¿Estás seguro de que deseas eliminar "${elementoParaEliminar?.nombre}" del catálogo?`}
        error={errorEliminar}
        guardando={
          elementoParaEliminar?.tipo === 'ubicacion'
            ? eliminarUbicacionMutation.isPending
            : eliminarSimpleMutation.isPending
        }
        onConfirmar={ejecutarEliminacion}
        onCerrar={() => {
          setElementoParaEliminar(null)
          setErrorEliminar(null)
        }}
      />
    </div>
  )
}
