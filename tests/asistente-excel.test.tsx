import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ImportarInventario } from '@/features/intercambio-datos/components/ImportarInventario'
import { ExportarDatos } from '@/features/intercambio-datos/components/ExportarDatos'
import {
  obtenerContextoImportacion,
  importarInventario,
  obtenerExportacion,
} from '@/features/intercambio-datos/api'
import { descargarExcel } from '@/features/intercambio-datos/exportarExcel'

vi.mock('@/features/intercambio-datos/api', () => ({
  obtenerContextoImportacion: vi.fn(),
  importarInventario: vi.fn(),
  obtenerExportacion: vi.fn(),
}))
vi.mock('@/features/auth', () => ({ useAuth: () => ({ perfil: { rol: 'admin' } }) }))
vi.mock('@/features/intercambio-datos/exportarExcel', () => ({
  crearExcelExportacion: vi.fn(async () => new ArrayBuffer(8)),
  descargarExcel: vi.fn(),
}))
vi.mock('@/features/intercambio-datos/leerExcel', () => ({
  leerArchivoInventario: vi.fn(async () => ({
    nombre: 'inventario.xlsx',
    hash: 'a'.repeat(64),
    hojas: [
      {
        nombre: 'Comunicación',
        encabezado: 1,
        columnas: ['Título', 'Autor', 'Editorial', 'Cantidad', 'Año', 'Ubicación'],
        mapeo: {
          titulo: 0,
          autor: 1,
          editorial: 2,
          cantidad: 3,
          anio: 4,
          ubicacion: 5,
          tipo: -1,
          categoria: -1,
        },
        filas: [
          {
            numero: 2,
            celdas: ['Libro de prueba', 'MINEDU', 'ECIR', 2, 2020, 'Estante A: Nivel 1'],
          },
        ],
      },
    ],
  })),
}))
const contexto = {
  catalogos: { autor: [], editorial: [], tipo: [], categoria: [], ubicacion: [] },
  materiales: [],
  equivalencias: [],
  importaciones: [],
}
function montar(elemento: React.ReactNode) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>{elemento}</MemoryRouter>
    </QueryClientProvider>,
  )
}
beforeEach(() => {
  vi.mocked(obtenerContextoImportacion).mockResolvedValue(contexto)
  vi.mocked(importarInventario).mockResolvedValue({
    id: 'importacion',
    filas: 1,
    materiales_nuevos: 1,
    ejemplares_creados: 2,
    ya_importado: false,
  })
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
async function cargar(usuario: ReturnType<typeof userEvent.setup>) {
  const archivo = new File(['prueba'], 'inventario.xlsx')
  Object.defineProperty(archivo, 'arrayBuffer', { value: async () => new ArrayBuffer(8) })
  await usuario.upload(screen.getByLabelText(/Archivo de inventario/), archivo)
}

it('revisa el archivo y exige la confirmación final antes de escribir en la base', async () => {
  montar(<ImportarInventario />)
  const usuario = userEvent.setup()
  await cargar(usuario)
  await usuario.type(
    await screen.findByLabelText('Tipo para las filas que no lo indican'),
    'Libro',
  )
  await usuario.click(screen.getByRole('button', { name: 'Analizar equivalencias' }))
  await usuario.click(
    await screen.findByRole('button', { name: 'Revisar filas y coincidencias' }),
  )
  await usuario.click(
    await screen.findByRole('button', { name: 'Ver resumen de importación' }),
  )
  expect(importarInventario).not.toHaveBeenCalled()
  await usuario.click(
    await screen.findByRole('button', { name: 'Confirmar e importar inventario' }),
  )
  await screen.findByText('Inventario importado correctamente')
  expect(vi.mocked(importarInventario).mock.calls[0][0].filas[0]).toMatchObject({
    titulo: 'Libro de prueba',
    cantidad: 2,
    estante: 'A',
    nivel: 1,
  })
})
it('reconoce un archivo ya importado y bloquea la carga repetida', async () => {
  vi.mocked(obtenerContextoImportacion).mockResolvedValue({
    ...contexto,
    importaciones: [
      {
        id: '1',
        archivo_hash: 'a'.repeat(64),
        nombre_archivo: 'inventario.xlsx',
        fecha: '2026-10-31T12:00:00Z',
        filas: 1,
        materiales_nuevos: 1,
        ejemplares_creados: 2,
      },
    ],
  })
  montar(<ImportarInventario />)
  const usuario = userEvent.setup()
  await cargar(usuario)
  await screen.findByText(/Este archivo ya fue importado/)
  expect(
    (screen.getByRole('button', { name: 'Analizar equivalencias' }) as HTMLButtonElement)
      .disabled,
  ).toBe(true)
  expect(importarInventario).not.toHaveBeenCalled()
})
it('solicita una instantánea completa y descarga el Excel solo al pulsar exportar', async () => {
  vi.mocked(obtenerExportacion).mockResolvedValue({
    materiales: [],
    ejemplares: [],
    personas: [],
    prestamos: [],
  })
  montar(<ExportarDatos />)
  expect(obtenerExportacion).not.toHaveBeenCalled()
  await userEvent.click(
    screen.getByRole('button', { name: 'Descargar Excel de la biblioteca' }),
  )
  await waitFor(() => expect(descargarExcel).toHaveBeenCalledTimes(1))
  expect(obtenerExportacion).toHaveBeenCalledWith(false)
})
