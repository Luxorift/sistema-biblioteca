export const camposExcel = [
  'titulo',
  'autor',
  'editorial',
  'cantidad',
  'anio',
  'ubicacion',
  'tipo',
  'categoria',
] as const
export type CampoExcel = (typeof camposExcel)[number]
export type CampoCatalogo = 'autor' | 'editorial' | 'tipo' | 'categoria' | 'ubicacion'
export type CeldaExcel = string | number | boolean | null

export interface HojaExcel {
  nombre: string
  encabezado: number
  columnas: string[]
  filas: { numero: number; celdas: CeldaExcel[] }[]
  mapeo: Record<CampoExcel, number>
}

export interface ArchivoInventario {
  nombre: string
  hash: string
  hojas: HojaExcel[]
}

export interface ConfiguracionHoja {
  incluir: boolean
  categoria: string
  tipo: string
  mapeo: Record<CampoExcel, number>
}

export interface FilaInventario {
  id: string
  hoja: string
  fila: number
  titulo: string
  autores: string[]
  editorial: string
  cantidad: string
  anio: string
  ubicacion: string
  tipo: string
  categoria: string
  originales: Record<CampoExcel, string>
  omitir: boolean
}

export interface OpcionExistente {
  id: number
  nombre: string
}
export interface MaterialExistente {
  id: number
  titulo: string
  editorial: string | null
  anio: number | null
  tipo: string
  categoria: string | null
}
export interface EquivalenciaGuardada {
  campo: CampoCatalogo
  origen_clave: string
  destino: string
}
export interface ImportacionRegistrada {
  id: string
  archivo_hash: string
  nombre_archivo: string
  fecha: string
  filas: number
  materiales_nuevos: number
  ejemplares_creados: number
}
export interface ContextoImportacion {
  catalogos: Record<CampoCatalogo, OpcionExistente[]>
  materiales: MaterialExistente[]
  equivalencias: EquivalenciaGuardada[]
  importaciones: ImportacionRegistrada[]
}

export interface GrupoEquivalencias {
  id: string
  campo: CampoCatalogo
  valores: string[]
  cantidades: number[]
  sugerido: string
}
export interface DecisionEquivalencia {
  separar: boolean
  destino: string
}
export interface EquivalenciaAplicada {
  campo: CampoCatalogo
  origen: string
  destino: string
}
export type DecisionDuplicado = 'sumar' | 'primera'
export type DecisionExistente = 'agregar' | 'omitir'
export interface FilaImportable {
  hoja: string
  fila: number
  titulo: string
  autores: string[]
  editorial: string | null
  cantidad: number
  anio: number | null
  estante: string
  nivel: number
  tipo: string
  categoria: string | null
  material_existente_id: number | null
  originales: Record<CampoExcel, string>
}
export interface ResultadoImportacion {
  id: string
  filas: number
  materiales_nuevos: number
  ejemplares_creados: number
  ya_importado: boolean
}
export type DatosExportacion = Record<string, Record<string, unknown>[]>
