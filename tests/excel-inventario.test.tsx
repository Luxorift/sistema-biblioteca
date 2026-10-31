// @vitest-environment node
import { expect, it } from 'vitest'
import ExcelJS from 'exceljs'
import { leerArchivoInventario } from '@/features/intercambio-datos/leerExcel'
import { crearExcelExportacion } from '@/features/intercambio-datos/exportarExcel'
import {
  crearGruposEquivalencias,
  similitud,
} from '@/features/intercambio-datos/normalizacion'
import {
  extraerFilas,
  prepararCarga,
  resolverEquivalencias,
} from '@/features/intercambio-datos/prepararImportacion'
import type {
  ContextoImportacion,
  FilaInventario,
} from '@/features/intercambio-datos/types'

const contexto: ContextoImportacion = {
  catalogos: { autor: [], editorial: [], tipo: [], categoria: [], ubicacion: [] },
  materiales: [],
  equivalencias: [],
  importaciones: [],
}
const fila = (cambios: Partial<FilaInventario> = {}): FilaInventario => ({
  id: '1',
  hoja: 'Libros',
  fila: 2,
  titulo: 'Libro Tomo 1',
  autores: ['MINEDU'],
  editorial: 'ECIR',
  cantidad: '2',
  anio: '2020',
  ubicacion: 'Estante A - Nivel 1',
  tipo: 'Libro',
  categoria: 'Comunicación',
  originales: {
    titulo: 'Libro Tomo 1',
    autor: 'MINEDU',
    editorial: 'ECIR',
    cantidad: '2',
    anio: '2020',
    ubicacion: 'Estante A - Nivel 1',
    tipo: 'Libro',
    categoria: 'Comunicación',
  },
  omitir: false,
  ...cambios,
})

it('lee cabeceras desplazadas, mapea nombres alternativos y conserva la hoja y fila originales', async () => {
  const libro = new ExcelJS.Workbook()
  const hoja = libro.addWorksheet('Comunicación')
  hoja.addRow([])
  hoja.addRow([])
  hoja.addRow([
    'Ítem',
    'Título del Material',
    'Autor',
    'Editorial',
    'Cantidad',
    'Año de Publicación',
    '(Estante-Nivel',
  ])
  hoja.addRow([
    1,
    'Manual 1',
    'MINEDU / NORMA',
    'ECIR',
    3,
    '2008 2012',
    'Estante A-Nivel 3',
  ])
  hoja.addRow([2, '   ', null, null, null, null, null])
  const archivo = await leerArchivoInventario(
    (await libro.xlsx.writeBuffer()) as ArrayBuffer,
    'inventario.xlsx',
  )
  expect(archivo.hash).toMatch(/^[a-f0-9]{64}$/)
  expect(archivo.hojas[0].encabezado).toBe(3)
  const filas = extraerFilas(
    archivo,
    {
      Comunicación: {
        incluir: true,
        categoria: 'Comunicación',
        tipo: 'Manual',
        mapeo: archivo.hojas[0].mapeo,
      },
    },
    '',
    true,
  )
  expect(filas).toHaveLength(1)
  expect(filas[0].fila).toBe(4)
  expect(filas[0].autores).toEqual(['MINEDU', 'NORMA'])
  expect(prepararCarga(filas, contexto, {}, {}).pendientes.join(' ')).toMatch(
    /un solo año/,
  )
})

it('agrupa variantes, exige decidirlas y evita confundir nombres con números distintos', () => {
  const filas = [fila(), fila({ id: '2', fila: 3, editorial: 'ecir' })]
  const grupos = crearGruposEquivalencias(filas, contexto)
  expect(grupos).toHaveLength(1)
  const resueltas = resolverEquivalencias(
    filas,
    grupos,
    { [grupos[0].id]: { separar: false, destino: 'ECIR' } },
    contexto,
  )
  expect(resueltas.filas.map((f) => f.editorial)).toEqual(['ECIR', 'ECIR'])
  expect(similitud('SOL 90', 'SOL 91')).toBe(0)
  expect(similitud('Manual Tomo 1', 'Manual Tomo 2')).toBe(0)
})

it('puede mantener separados los nombres parecidos aunque exista una equivalencia anterior', () => {
  const datos = {
    ...contexto,
    equivalencias: [
      {
        campo: 'autor' as const,
        origen_clave: 'juilio villanueva',
        destino: 'Julio Villanueva',
      },
    ],
  }
  const filas = [
    fila({ autores: ['Juilio Villanueva'] }),
    fila({ id: '2', autores: ['Julio Villanueva'] }),
  ]
  const grupos = crearGruposEquivalencias(filas, datos)
  expect(grupos).toHaveLength(1)
  const resultado = resolverEquivalencias(
    filas,
    grupos,
    { [grupos[0].id]: { separar: true, destino: '' } },
    datos,
  )
  expect(resultado.filas[0].autores).toEqual(['Juilio Villanueva'])
})

it('no suma filas repetidas ni añade a fichas existentes sin una decisión explícita', () => {
  const filas = [fila(), fila({ id: '2', fila: 3, ubicacion: 'Estante B: Nivel 2' })]
  let carga = prepararCarga(filas, contexto, {}, {})
  expect(carga.pendientes.join(' ')).toMatch(/repetidas/)
  const clave = JSON.stringify(['libro tomo 1', 'ecir', '2020'])
  carga = prepararCarga(filas, contexto, { [clave]: 'sumar' }, {})
  expect(carga.pendientes).toEqual([])
  expect(carga.filas.map((f) => f.estante)).toEqual(['A', 'B'])
  expect(prepararCarga(filas, contexto, { [clave]: 'primera' }, {}).filas).toHaveLength(1)
  const registrados = {
    ...contexto,
    materiales: [
      {
        id: 8,
        titulo: 'Libro Tomo 1',
        editorial: 'ECIR',
        anio: 2020,
        tipo: 'Manual',
        categoria: null,
      },
    ],
  }
  expect(prepararCarga([fila()], registrados, {}, {}).pendientes.join(' ')).toMatch(
    /ya registrado/,
  )
  expect(
    prepararCarga([fila()], registrados, {}, { [clave]: 'agregar' }).filas[0]
      .material_existente_id,
  ).toBe(8)
})

it('exporta todas las filas, conserva DNI con ceros y escribe texto que parece fórmula como texto', async () => {
  const datos = {
    materiales: [
      {
        id: 1,
        titulo: '=SUM(A1:A2)',
        autores: 'MINEDU',
        tipo: 'Libro',
        categoria: 'Comunicación',
        editorial: 'ECIR',
        anio: 2020,
        copias_totales: 1501,
        disponibles: 1501,
      },
    ],
    personas: [
      { id: 1, codigo: 'PER-000001', nombres: 'Ana', dni: '00123456', activo: true },
    ],
    ejemplares: Array.from({ length: 1501 }, (_, i) => ({
      id: i + 1,
      codigo: `BIB-${i + 1}`,
      material_id: 1,
      titulo: 'Libro',
      estado: 'disponible',
      estante: 'A',
      nivel: 1,
    })),
  }
  const buffer = await crearExcelExportacion(datos)
  const libro = new ExcelJS.Workbook()
  await libro.xlsx.load(buffer)
  expect(libro.getWorksheet('Ejemplares')!.rowCount).toBe(1502)
  expect(libro.getWorksheet('Personas y alumnos')!.getCell('F2').value).toBe('00123456')
  expect(libro.getWorksheet('Materiales')!.getCell('B2').value).toBe('=SUM(A1:A2)')
  expect(libro.getWorksheet('Materiales')!.getCell('B2').type).toBe(
    ExcelJS.ValueType.String,
  )
  expect(libro.getWorksheet('Materiales')!.getCell('G2').value).toBe(2020)
})

it('no propone cambiar de estante por parecido con una ubicación existente', () => {
  const datos = {
    ...contexto,
    catalogos: {
      ...contexto.catalogos,
      ubicacion: [{ id: 1, nombre: 'Estante A: Nivel 1' }],
    },
  }
  expect(
    crearGruposEquivalencias([fila({ ubicacion: 'Estante B: Nivel 1' })], datos),
  ).toEqual([])
  const grupos = crearGruposEquivalencias(
    [
      fila({ ubicacion: 'Estante B: Nivel 1' }),
      fila({ id: '2', ubicacion: 'Estante B-Nivel 1' }),
    ],
    datos,
  )
  expect(grupos[0].sugerido).toBe('Estante B: Nivel 1')
})
