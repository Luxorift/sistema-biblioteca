import type ExcelJS from 'exceljs'
import {
  camposExcel,
  type ArchivoInventario,
  type CampoExcel,
  type CeldaExcel,
  type HojaExcel,
} from './types'
import { normalizarTexto } from './normalizacion'

const aliasColumnas: Record<CampoExcel, string[]> = {
  titulo: [
    'titulo del material',
    'titulo de la obras',
    'titulo de las obras',
    'titulo',
    'material',
  ],
  autor: ['autor', 'autores'],
  editorial: ['editorial'],
  cantidad: ['cantidad', 'copias', 'ejemplares'],
  anio: ['ano de publicacion', 'anio de publicacion', 'ano', 'anio'],
  ubicacion: ['estante nivel', 'ubicacion'],
  tipo: ['tipo', 'tipo de material'],
  categoria: ['categoria', 'area', 'area o categoria'],
}

function valorCelda(valor: ExcelJS.CellValue): CeldaExcel {
  if (valor === null || valor === undefined) return null
  if (
    typeof valor === 'string' ||
    typeof valor === 'number' ||
    typeof valor === 'boolean'
  )
    return valor
  if (valor instanceof Date) return valor.getUTCFullYear()
  if ('richText' in valor) return valor.richText.map((parte) => parte.text).join('')
  if ('hyperlink' in valor) return valor.text
  // No se ejecutan fórmulas. Una fórmula sin resultado almacenado queda pendiente.
  if ('formula' in valor || 'sharedFormula' in valor)
    return valor.result === undefined
      ? '[Fórmula sin resultado]'
      : valorCelda(valor.result)
  return '[Celda con error]'
}

export async function leerArchivoInventario(
  buffer: ArrayBuffer,
  nombre: string,
): Promise<ArchivoInventario> {
  if (!nombre.toLowerCase().endsWith('.xlsx'))
    throw new Error('Selecciona un archivo Excel .xlsx.')
  if (buffer.byteLength > 10 * 1024 * 1024)
    throw new Error('El archivo no debe superar 10 MB.')
  const bibliotecaExcel = (await import('exceljs')).default
  const libro = new bibliotecaExcel.Workbook()
  try {
    await libro.xlsx.load(buffer)
  } catch {
    throw new Error(
      'No se pudo leer el Excel. Comprueba que no esté dañado o protegido por contraseña.',
    )
  }
  const hojas: HojaExcel[] = []
  let totalCeldas = 0
  for (const hoja of libro.worksheets) {
    if (hoja.rowCount > 10000 || hoja.columnCount > 100)
      throw new Error(
        'El archivo tiene una hoja demasiado grande. Usa hasta 10.000 filas y 100 columnas por hoja.',
      )
    let encabezado = 0
    let columnas: string[] = []
    const filas: HojaExcel['filas'] = []
    hoja.eachRow((fila, numero) => {
      totalCeldas += fila.cellCount
      const celdas: CeldaExcel[] = []
      for (let c = 1; c <= hoja.columnCount; c++)
        celdas.push(valorCelda(fila.getCell(c).value))
      if (
        !encabezado &&
        numero <= 20 &&
        celdas.some((v) =>
          aliasColumnas.titulo.includes(normalizarTexto(String(v ?? ''))),
        )
      ) {
        encabezado = numero
        columnas = celdas.map((v, i) => String(v ?? '').trim() || `Columna ${i + 1}`)
      } else if (encabezado && celdas.some((v) => String(v ?? '').trim()))
        filas.push({ numero, celdas })
    })
    if (!encabezado) continue
    const mapeo = Object.fromEntries(
      camposExcel.map((campo) => [
        campo,
        columnas.findIndex((columna) =>
          aliasColumnas[campo].includes(normalizarTexto(columna)),
        ),
      ]),
    ) as Record<CampoExcel, number>
    hojas.push({ nombre: hoja.name, encabezado, columnas, filas, mapeo })
  }
  if (totalCeldas > 100000 || hojas.reduce((n, h) => n + h.filas.length, 0) > 5000)
    throw new Error('Usa como máximo 5.000 filas de inventario por archivo.')
  if (!hojas.length)
    throw new Error(
      'No se encontró una cabecera de inventario con una columna Título. Revisa los encabezados del Excel.',
    )
  const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', buffer))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return { nombre, hash, hojas }
}
