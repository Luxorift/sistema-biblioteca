import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { PrestamosPage } from '@/features/prestamos/PrestamosPage'
import { DevolverPage } from '@/features/devoluciones/DevolverPage'
import { consultarCredencial } from '@/features/personas/api'
import {
  obtenerPrestamosPendientes,
  registrarDevolucion,
} from '@/features/devoluciones/api'

vi.mock('@/features/personas/api', () => ({ consultarCredencial: vi.fn() }))
vi.mock('@/features/devoluciones/api', () => ({
  obtenerPrestamosPendientes: vi.fn(),
  registrarDevolucion: vi.fn(),
}))
// Aislar el formulario de libros: esta prueba verifica la transferencia de la persona.
vi.mock('@/features/prestamos/PrestarPage', () => ({
  PrestarPage: ({ personaInicial }: { personaInicial?: { nombreCompleto: string } }) => (
    <p>Persona elegida: {personaInicial?.nombreCompleto}</p>
  ),
}))
vi.mock('@/features/prestamos/HistorialPrestamosPage', () => ({
  HistorialPrestamosPage: () => null,
}))

const pendiente = {
  id: 15,
  codigo: 'BIB-000001',
  titulo: 'Libro elegido',
  persona: 'Ana Pérez',
  dni: '12345678',
  tipoPersona: 'Estudiante',
  fechaPrestamo: '2020-01-01',
  fechaLimite: null,
}
function montar(elemento: React.ReactNode, ruta = '/prestamos') {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[ruta]}>{elemento}</MemoryRouter>
    </QueryClientProvider>,
  )
}
beforeEach(() => {
  vi.mocked(obtenerPrestamosPendientes).mockResolvedValue([
    pendiente,
    { ...pendiente, id: 16, codigo: 'BIB-000002', titulo: 'Otro libro' },
  ])
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
})
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

it('el mostrador transfiere la persona de la credencial al formulario de préstamo', async () => {
  vi.mocked(consultarCredencial).mockResolvedValue({
    persona: {
      id: 1,
      codigo: 'PER-000001',
      nombres: 'Ana',
      apellidoPaterno: 'Pérez',
      apellidoMaterno: 'López',
      dni: '12345678',
      tipoPersona: 'Estudiante',
      activo: true,
    },
    pendientes: 0,
    atrasados: 0,
    maxDiasAtraso: 0,
    prestamos: [],
  })
  montar(<PrestamosPage />)
  const usuario = userEvent.setup()
  await usuario.type(screen.getByLabelText('Código de credencial'), 'PER-000001{Enter}')
  await usuario.click(
    await screen.findByRole('button', { name: 'Prestar a esta persona' }),
  )
  expect(await screen.findByText('Persona elegida: Pérez López, Ana')).toBeTruthy()
})

it('el enlace de credencial filtra el préstamo y exige confirmación antes de devolverlo', async () => {
  vi.mocked(registrarDevolucion).mockResolvedValue({
    codigo: pendiente.codigo,
    titulo: pendiente.titulo,
    persona: pendiente.persona,
    fechaDevolucion: '2026-10-31',
  })
  montar(<DevolverPage />, '/prestamos?tab=devolver&prestamoId=15')
  await screen.findByText('Libro elegido')
  expect(screen.queryByText('Otro libro')).toBeNull()
  expect(registrarDevolucion).not.toHaveBeenCalled()
  const usuario = userEvent.setup()
  await usuario.click(screen.getByRole('button', { name: 'Registrar devolución' }))
  expect(registrarDevolucion).not.toHaveBeenCalled()
  await usuario.click(
    await screen.findByRole('button', { name: 'Sí, registrar devolución' }),
  )
  await waitFor(() => expect(registrarDevolucion).toHaveBeenCalledTimes(1))
  expect(vi.mocked(registrarDevolucion).mock.calls[0][0].id).toBe(15)
})
