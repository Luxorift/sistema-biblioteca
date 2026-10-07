import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { Alert } from '@/components/ui/Alert'
import { useCatalogo, useEditoriales, useUbicaciones } from '@/features/catalogos'
import { FormularioMaterial } from './components/FormularioMaterial'
import { NuevoCatalogoDialog } from './components/NuevoCatalogoDialog'
import { ResumenExito } from './components/ResumenExito'
import { Similares } from './components/Similares'
import { esquemaMaterial, type FormularioMaterial as DatosFormulario } from './schemas'
import { useAgregarEjemplares, useRegistrarMaterial, useSimilares } from './useMateriales'
import { useDebouncedValue } from './useDebouncedValue'
import type { MaterialSimilar, ResumenMaterial } from './types'

type Dialogo = 'tipos_material' | 'categorias' | 'ubicacion' | null

export function AgregarMaterialPage() {
  const formulario = useForm<DatosFormulario>({
    resolver: zodResolver(esquemaMaterial),
    defaultValues: {
      titulo: '',
      tipoMaterialId: 0,
      categoriaId: null,
      editorial: '',
      anio: null,
      autores: [],
      cantidad: 1,
      ubicacionId: null,
    },
  })
  const titulo = useWatch({ control: formulario.control, name: 'titulo' })
  const tituloConDemora = useDebouncedValue(titulo)
  const tipos = useCatalogo('tipos_material')
  const categorias = useCatalogo('categorias')
  const ubicaciones = useUbicaciones()
  const editoriales = useEditoriales()
  const similares = useSimilares(tituloConDemora)
  const registrar = useRegistrarMaterial()
  const agregarCopias = useAgregarEjemplares()
  const [dialogo, setDialogo] = useState<Dialogo>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, setPendiente] = useState<{
    materialId: number
    cantidad: number
    ubicacionId: number | null
  } | null>(null)
  const [resumen, setResumen] = useState<ResumenMaterial | null>(null)
  const cargandoCatalogos =
    tipos.isLoading ||
    categorias.isLoading ||
    ubicaciones.isLoading ||
    editoriales.isLoading
  const errorCatalogos =
    tipos.isError || categorias.isError || ubicaciones.isError || editoriales.isError

  const crearCopias = async (
    materialId: number,
    cantidad: number,
    ubicacionId: number | null,
    tituloMaterial: string,
  ) => {
    const ejemplares = await agregarCopias.mutateAsync({
      materialId,
      cantidad,
      ubicacionId,
    })
    setResumen({
      materialId,
      titulo: tituloMaterial,
      codigos: ejemplares.map(({ codigo }) => codigo),
    })
    setPendiente(null)
  }
  const enviar = async (datos: DatosFormulario) => {
    setError(null)
    try {
      const datosMaterial = {
        ...datos,
        autores: datos.autores.map(({ nombre }) => nombre).filter(Boolean),
      }
      const resultado = await registrar.mutateAsync(datosMaterial)
      if (resultado.yaExistia) {
        setPendiente({
          materialId: resultado.materialId,
          cantidad: datos.cantidad,
          ubicacionId: datos.ubicacionId,
        })
        return
      }
      await crearCopias(
        resultado.materialId,
        datos.cantidad,
        datos.ubicacionId,
        datos.titulo,
      )
    } catch {
      setError(
        'No se pudo guardar el material. Revisa los datos y tu conexión, luego intenta de nuevo.',
      )
    }
  }
  const seleccionarSimilar = (material: MaterialSimilar) => {
    setPendiente({
      materialId: material.id,
      cantidad: formulario.getValues('cantidad'),
      ubicacionId: formulario.getValues('ubicacionId'),
    })
  }
  const reiniciar = () => {
    formulario.reset()
    setResumen(null)
    setPendiente(null)
    setError(null)
  }
  if (resumen) return <ResumenExito resumen={resumen} onOtro={reiniciar} />
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-bold">Agregar material</h1>
        <p className="text-tinta-suave text-xl">
          Registra la ficha y las copias físicas que llegaron.
        </p>
      </div>
      {errorCatalogos && (
        <Alert>
          No se pudieron cargar las opciones. Recarga la página e intenta de nuevo.
        </Alert>
      )}
      {error && <Alert>{error}</Alert>}
      {tituloConDemora.trim().length >= 3 && (
        <Similares
          materiales={similares.data ?? []}
          cargando={similares.isLoading}
          error={similares.isError}
          onAgregarCopias={seleccionarSimilar}
        />
      )}
      {pendiente && (
        <section
          className="border-primario space-y-4 rounded-2xl border-2 bg-white p-5"
          aria-live="polite"
        >
          <h2 className="text-2xl font-bold">Este material ya existe</h2>
          <p>
            La ficha no se duplicó. ¿Quieres agregar {pendiente.cantidad}{' '}
            {pendiente.cantidad === 1 ? 'copia' : 'copias'} a ese material?
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="bg-primario min-h-12 rounded-xl px-5 text-lg font-bold text-white"
              onClick={() =>
                crearCopias(
                  pendiente.materialId,
                  pendiente.cantidad,
                  pendiente.ubicacionId,
                  formulario.getValues('titulo'),
                )
              }
              disabled={agregarCopias.isPending}
            >
              {agregarCopias.isPending ? 'Guardando…' : 'Sí, agregar copias'}
            </button>
            <button
              type="button"
              className="border-borde min-h-12 rounded-xl border-2 bg-white px-5 text-lg font-bold"
              onClick={() => setPendiente(null)}
            >
              Corregir datos
            </button>
          </div>
        </section>
      )}
      <FormularioMaterial
        formulario={formulario}
        tipos={tipos.data ?? []}
        categorias={categorias.data ?? []}
        ubicaciones={ubicaciones.data ?? []}
        editoriales={editoriales.data ?? []}
        cargandoCatalogos={cargandoCatalogos}
        onNuevo={setDialogo}
        onEnviar={enviar}
        guardando={registrar.isPending || agregarCopias.isPending}
      />
      {dialogo && (
        <NuevoCatalogoDialog
          abierto
          tipo={dialogo}
          onCerrar={() => setDialogo(null)}
          onCreado={(id) => {
            if (dialogo === 'tipos_material') formulario.setValue('tipoMaterialId', id)
            if (dialogo === 'categorias') formulario.setValue('categoriaId', id)
            if (dialogo === 'ubicacion') formulario.setValue('ubicacionId', id)
          }}
        />
      )}
    </div>
  )
}
