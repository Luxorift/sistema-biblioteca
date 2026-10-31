import { supabase } from '@/lib/supabase'
import type {
  ContextoImportacion,
  DatosExportacion,
  EquivalenciaAplicada,
  FilaImportable,
  ResultadoImportacion,
} from './types'

export async function obtenerContextoImportacion(): Promise<ContextoImportacion> {
  const { data, error } = await supabase.rpc('contexto_importacion_excel')
  if (error)
    throw new Error(
      'No se pudo consultar el inventario para revisar el Excel. Revisa la conexión y la migración de importación.',
    )
  return data as ContextoImportacion
}

export async function importarInventario(datos: {
  hash: string
  nombre: string
  filas: FilaImportable[]
  equivalencias: EquivalenciaAplicada[]
}): Promise<ResultadoImportacion> {
  const { data, error } = await supabase.rpc('importar_inventario_excel', {
    p_hash: datos.hash,
    p_nombre: datos.nombre,
    p_filas: datos.filas,
    p_equivalencias: datos.equivalencias,
  })
  if (error)
    throw new Error(
      error.message.includes('inventario cambió')
        ? error.message
        : 'No se pudo confirmar el resultado de la importación. Revisa los datos y vuelve a intentarlo con el mismo archivo; el sistema evita cargarlo dos veces.',
    )
  return data as ResultadoImportacion
}

export async function obtenerExportacion(
  incluirUsuarios: boolean,
): Promise<DatosExportacion> {
  const { data, error } = await supabase.rpc('exportar_biblioteca_excel', {
    p_incluir_usuarios: incluirUsuarios,
  })
  if (error)
    throw new Error(
      'No se pudieron obtener los datos para exportar. Comprueba tu conexión y tus permisos.',
    )
  return data as DatosExportacion
}
