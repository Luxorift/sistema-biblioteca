import { useMemo, useState } from 'react'
import { leerArchivoInventario } from './leerExcel'
import { crearGruposEquivalencias, normalizarTexto } from './normalizacion'
import {
  equivalenciasVigentes,
  extraerFilas,
  prepararCarga,
  resolverEquivalencias,
} from './prepararImportacion'
import type {
  ArchivoInventario,
  ConfiguracionHoja,
  ContextoImportacion,
  DecisionDuplicado,
  DecisionEquivalencia,
  DecisionExistente,
  FilaInventario,
  GrupoEquivalencias,
  ResultadoImportacion,
} from './types'
import { useContextoImportacion, useImportarInventario } from './useIntercambioDatos'

const vacio: ContextoImportacion = {
  catalogos: { autor: [], editorial: [], tipo: [], categoria: [], ubicacion: [] },
  materiales: [],
  equivalencias: [],
  importaciones: [],
}

export function useAsistenteImportacion() {
  const contexto = useContextoImportacion()
  const importar = useImportarInventario()
  const [archivo, setArchivo] = useState<ArchivoInventario | null>(null)
  const [configuracion, setConfiguracion] = useState<Record<string, ConfiguracionHoja>>(
    {},
  )
  const [tipoGeneral, setTipoGeneral] = useState('')
  const [separarAutores, setSepararAutores] = useState(true)
  const [paso, setPaso] = useState(0)
  const [leyendo, setLeyendo] = useState(false)
  const [error, setError] = useState('')
  const [base, setBase] = useState<FilaInventario[]>([])
  const [grupos, setGrupos] = useState<GrupoEquivalencias[]>([])
  const [decisiones, setDecisiones] = useState<Record<string, DecisionEquivalencia>>({})
  const [correcciones, setCorrecciones] = useState<
    Record<string, Partial<FilaInventario>>
  >({})
  const [duplicados, setDuplicados] = useState<Record<string, DecisionDuplicado>>({})
  const [existentes, setExistentes] = useState<Record<string, DecisionExistente>>({})
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null)
  const datos = contexto.data ?? vacio
  const resueltas = useMemo(
    () => resolverEquivalencias(base, grupos, decisiones, datos),
    [base, grupos, decisiones, datos],
  )
  const filas = useMemo(
    () => resueltas.filas.map((f) => ({ ...f, ...correcciones[f.id] })),
    [resueltas.filas, correcciones],
  )
  const carga = useMemo(
    () => prepararCarga(filas, datos, duplicados, existentes),
    [filas, datos, duplicados, existentes],
  )
  const gruposPendientes = grupos.filter((g) => !decisiones[g.id]).length
  const importada = archivo
    ? datos.importaciones.find((i) => i.archivo_hash === archivo.hash)
    : undefined

  const cargar = async (fichero: File) => {
    setLeyendo(true)
    setError('')
    setResultado(null)
    setArchivo(null)
    setPaso(0)
    try {
      const leido = await leerArchivoInventario(await fichero.arrayBuffer(), fichero.name)
      setConfiguracion(
        Object.fromEntries(
          leido.hojas.map((h) => [
            h.nombre,
            {
              incluir: true,
              categoria: h.nombre.trim(),
              tipo: '',
              mapeo: { ...h.mapeo },
            },
          ]),
        ),
      )
      setArchivo(leido)
      setPaso(1)
      setCorrecciones({})
      setDecisiones({})
      setDuplicados({})
      setExistentes({})
      setBase([])
      setGrupos([])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el archivo.')
    } finally {
      setLeyendo(false)
    }
  }
  const analizar = () => {
    if (!archivo) return
    if (!Object.values(configuracion).some((c) => c.incluir)) {
      setError('Selecciona al menos una hoja.')
      return
    }
    if (
      Object.values(configuracion).some(
        (c) => c.incluir && (c.mapeo.titulo < 0 || c.mapeo.cantidad < 0),
      )
    ) {
      setError('Asigna las columnas de título y cantidad de cada hoja seleccionada.')
      return
    }
    const nuevas = extraerFilas(archivo, configuracion, tipoGeneral, separarAutores)
    if (!nuevas.length) {
      setError('No hay filas de inventario en las hojas seleccionadas.')
      return
    }
    if (nuevas.some((fila) => !fila.tipo.trim())) {
      setError(
        'Elige un tipo general o un tipo por hoja para las filas que no lo indican.',
      )
      return
    }
    const detectados = crearGruposEquivalencias(nuevas, datos)
    const recordadas: Record<string, DecisionEquivalencia> = {}
    for (const grupo of detectados) {
      const conocidas = grupo.valores.map((v) =>
        datos.equivalencias.find(
          (e) => e.campo === grupo.campo && e.origen_clave === normalizarTexto(v),
        ),
      )
      if (
        conocidas.every(Boolean) &&
        new Set(conocidas.map((e) => e!.destino)).size === 1
      )
        recordadas[grupo.id] = { separar: false, destino: conocidas[0]!.destino }
    }
    setBase(nuevas)
    setGrupos(detectados)
    setDecisiones(recordadas)
    setCorrecciones({})
    setDuplicados({})
    setExistentes({})
    setError('')
    setPaso(2)
  }
  const confirmar = async () => {
    if (!archivo || gruposPendientes || carga.pendientes.length || importada) return
    setError('')
    try {
      const ids = new Set(carga.filas.map((f) => JSON.stringify([f.hoja, f.fila])))
      const respuesta = await importar.mutateAsync({
        hash: archivo.hash,
        nombre: archivo.nombre,
        filas: carga.filas,
        equivalencias: equivalenciasVigentes(
          resueltas.equivalencias,
          filas.filter((f) => ids.has(f.id)),
        ),
      })
      setResultado(respuesta)
      setPaso(5)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo importar el archivo.')
    }
  }
  return {
    archivo,
    configuracion,
    setConfiguracion,
    tipoGeneral,
    setTipoGeneral,
    separarAutores,
    setSepararAutores,
    paso,
    setPaso,
    leyendo,
    error,
    setError,
    cargar,
    analizar,
    contexto,
    datos,
    grupos,
    decisiones,
    setDecisiones,
    gruposPendientes,
    filas,
    setCorrecciones,
    duplicados,
    setDuplicados,
    existentes,
    setExistentes,
    carga,
    confirmar,
    guardando: importar.isPending,
    resultado,
    importada,
  }
}
