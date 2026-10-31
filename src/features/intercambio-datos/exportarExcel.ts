import type ExcelJS from 'exceljs'
import type { DatosExportacion } from './types'
import { fechaBiblioteca } from '@/lib/fechas'

const hojas: Record<string, { nombre: string; columnas: [string, string][] }> = {
  materiales: {
    nombre: 'Materiales',
    columnas: [
      ['id', 'ID'],
      ['titulo', 'Título'],
      ['autores', 'Autores'],
      ['tipo', 'Tipo'],
      ['categoria', 'Categoría'],
      ['editorial', 'Editorial'],
      ['anio', 'Año'],
      ['copias_totales', 'Copias totales'],
      ['copias_activas', 'Copias activas'],
      ['disponibles', 'Disponibles'],
      ['notas', 'Notas'],
      ['creado_en', 'Creado en'],
      ['actualizado_en', 'Actualizado en'],
    ],
  },
  ejemplares: {
    nombre: 'Ejemplares',
    columnas: [
      ['id', 'ID'],
      ['codigo', 'Código'],
      ['material_id', 'ID material'],
      ['titulo', 'Título'],
      ['estado', 'Estado'],
      ['estante', 'Estante'],
      ['nivel', 'Nivel'],
      ['observaciones', 'Observaciones'],
      ['creado_en', 'Creado en'],
    ],
  },
  personas: {
    nombre: 'Personas y alumnos',
    columnas: [
      ['id', 'ID'],
      ['codigo', 'Credencial'],
      ['nombres', 'Nombres'],
      ['apellido_paterno', 'Apellido paterno'],
      ['apellido_materno', 'Apellido materno'],
      ['dni', 'DNI'],
      ['correo', 'Correo'],
      ['tipo', 'Tipo de persona'],
      ['activo', 'Activo'],
      ['prestamos_pendientes', 'Préstamos pendientes'],
      ['creado_en', 'Creado en'],
    ],
  },
  prestamos: {
    nombre: 'Préstamos',
    columnas: [
      ['id', 'ID'],
      ['ejemplar', 'Código del ejemplar'],
      ['titulo', 'Título'],
      ['credencial', 'Credencial'],
      ['persona', 'Persona'],
      ['dni', 'DNI'],
      ['fecha_prestamo', 'Fecha de préstamo'],
      ['fecha_limite', 'Fecha límite'],
      ['fecha_devolucion', 'Fecha de devolución'],
      ['estado', 'Estado'],
      ['dias_atraso', 'Días de atraso'],
      ['registrado_por', 'Registrado por (ID)'],
      ['observaciones', 'Observaciones'],
    ],
  },
  categorias: {
    nombre: 'Categorías',
    columnas: [
      ['id', 'ID'],
      ['nombre', 'Nombre'],
    ],
  },
  tipos_material: {
    nombre: 'Tipos de material',
    columnas: [
      ['id', 'ID'],
      ['nombre', 'Nombre'],
    ],
  },
  editoriales: {
    nombre: 'Editoriales',
    columnas: [
      ['id', 'ID'],
      ['nombre', 'Nombre'],
    ],
  },
  autores: {
    nombre: 'Autores',
    columnas: [
      ['id', 'ID'],
      ['nombre', 'Nombre'],
    ],
  },
  ubicaciones: {
    nombre: 'Ubicaciones',
    columnas: [
      ['id', 'ID'],
      ['estante', 'Estante'],
      ['nivel', 'Nivel'],
    ],
  },
  tipos_persona: {
    nombre: 'Tipos de persona',
    columnas: [
      ['id', 'ID'],
      ['nombre', 'Nombre'],
    ],
  },
  importaciones: {
    nombre: 'Importaciones',
    columnas: [
      ['id', 'ID'],
      ['nombre_archivo', 'Archivo'],
      ['fecha', 'Fecha'],
      ['filas', 'Filas importadas'],
      ['materiales_nuevos', 'Materiales nuevos'],
      ['ejemplares_creados', 'Copias creadas'],
      ['archivo_hash', 'Identificador del archivo'],
    ],
  },
  equivalencias: {
    nombre: 'Equivalencias',
    columnas: [
      ['campo', 'Campo'],
      ['origen_clave', 'Variante reconocida'],
      ['destino_id', 'ID del catálogo'],
      ['actualizado_en', 'Actualizada en'],
    ],
  },
  origen_importacion: {
    nombre: 'Origen de las filas',
    columnas: [
      ['importacion_id', 'ID importación'],
      ['hoja', 'Hoja original'],
      ['fila', 'Fila original'],
      ['material_id', 'ID material'],
      ['cantidad', 'Copias'],
      ['ubicacion_id', 'ID ubicación'],
      ['originales', 'Datos originales'],
    ],
  },
  usuarios: {
    nombre: 'Usuarios del sistema',
    columnas: [
      ['id', 'ID'],
      ['nombre', 'Nombre'],
      ['rol', 'Rol'],
      ['activo', 'Activo'],
      ['created_at', 'Creado en'],
    ],
  },
}

function fechaExcel(valor: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) return new Date(`${valor}T00:00:00Z`)
  const partes = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(valor))
  const numero = (tipo: string) => Number(partes.find((p) => p.type === tipo)!.value)
  return new Date(
    Date.UTC(
      numero('year'),
      numero('month') - 1,
      numero('day'),
      numero('hour'),
      numero('minute'),
      numero('second'),
    ),
  )
}

export async function crearExcelExportacion(
  datos: DatosExportacion,
): Promise<ArrayBuffer> {
  const bibliotecaExcel = (await import('exceljs')).default
  const libro = new bibliotecaExcel.Workbook()
  libro.creator = 'Sistema de biblioteca'
  const resumen = libro.addWorksheet('Resumen')
  resumen.columns = [
    { header: 'Contenido', key: 'contenido', width: 30 },
    { header: 'Registros', key: 'registros', width: 20 },
  ]
  resumen.addRow({
    contenido: 'Fecha de exportación',
    registros: fechaExcel(fechaBiblioteca()),
  })
  resumen.getCell('B2').numFmt = 'dd/mm/yyyy'
  resumen.addRow({ contenido: 'Zona horaria', registros: 'America/Lima' })
  for (const [clave, definicion] of Object.entries(hojas)) {
    if (!(clave in datos)) continue
    const registros = datos[clave]
    resumen.addRow({ contenido: definicion.nombre, registros: registros.length })
    const hoja = libro.addWorksheet(definicion.nombre, {
      views: [{ state: 'frozen', ySplit: 1 }],
    })
    hoja.columns = definicion.columnas.map(([key, header]) => ({
      key,
      header,
      width:
        key === 'titulo' || key === 'originales'
          ? 55
          : key === 'nombre' || key === 'persona'
            ? 35
            : 23,
    }))
    for (const registro of registros) {
      const valores: Record<string, ExcelJS.CellValue> = {}
      for (const [key] of definicion.columnas) {
        const valor = registro[key]
        const esFecha = /^(fecha|created_at|creado_en|actualizado_en)/.test(key)
        valores[key] =
          valor === null || valor === undefined
            ? null
            : esFecha && typeof valor === 'string'
              ? fechaExcel(valor)
              : typeof valor === 'object'
                ? JSON.stringify(valor)
                : typeof valor === 'string' ||
                    typeof valor === 'number' ||
                    typeof valor === 'boolean'
                  ? valor
                  : String(valor)
      }
      // Las cadenas se escriben como texto, incluso si comienzan por =, + o @.
      hoja.addRow(valores)
    }
    for (const [key] of definicion.columnas) {
      if (/^(fecha|created_at|creado_en|actualizado_en)/.test(key))
        hoja.getColumn(key).numFmt =
          key === 'fecha_limite' ? 'dd/mm/yyyy' : 'dd/mm/yyyy hh:mm'
      if (key === 'dni' || key === 'codigo' || key === 'credencial')
        hoja.getColumn(key).numFmt = '@'
    }
    hoja.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: Math.max(1, hoja.rowCount), column: definicion.columnas.length },
    }
  }
  for (const hoja of libro.worksheets) {
    hoja.getRow(1).font = { name: 'Arial', bold: true, color: { argb: 'FFFFFFFF' } }
    hoja.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF24476B' },
    }
    hoja.getRow(1).height = 24
    hoja.eachRow((fila, indice) => {
      if (indice > 1) fila.font = { name: 'Arial', size: 11 }
      fila.alignment = { vertical: 'middle' }
    })
  }
  return (await libro.xlsx.writeBuffer()) as ArrayBuffer
}

export function descargarExcel(buffer: ArrayBuffer, nombre: string) {
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  )
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.append(enlace)
  enlace.click()
  enlace.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
