import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { PrestarPage } from '@/features/prestamos/PrestarPage'
import {
  obtenerMaterialesPrestables,
  obtenerPersonasActivas,
  registrarPrestamo,
} from '@/features/prestamos/api'

vi.mock('@/features/prestamos/api', () => ({
  obtenerMaterialesPrestables: vi.fn(),
  obtenerPersonasActivas: vi.fn(),
  registrarPrestamo: vi.fn(),
}))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

it('registra el préstamo con el ID de la persona seleccionada por credencial', async () => {
  const persona = {
    id: 9,
    nombreCompleto: 'Pérez, Ana',
    dni: '12345678',
    tipo: 'Estudiante',
  }
  const copia = {
    id: 5,
    codigo: 'BIB-000005',
    titulo: 'Libro de prueba',
    ubicacion: null,
  }
  vi.mocked(obtenerMaterialesPrestables).mockResolvedValue([
    {
      id: 1,
      titulo: copia.titulo,
      editorial: null,
      anio: null,
      tipo: 'Libro',
      categoria: null,
      autores: [],
      copias: [copia],
      cantidadCopias: 1,
    },
  ])
  // La persona escaneada no necesita estar dentro de la primera página del selector.
  vi.mocked(obtenerPersonasActivas).mockResolvedValue([])
  vi.mocked(registrarPrestamo).mockResolvedValue({
    codigos: [copia.codigo],
    titulo: copia.titulo,
    persona: persona.nombreCompleto,
    fechaPrestamo: '2026-10-31',
    fechaLimite: null,
  })
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <PrestarPage personaInicial={persona} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  expect(await screen.findByText('Pérez, Ana')).toBeTruthy()
  const usuario = userEvent.setup()
  await usuario.click(
    screen.getByRole('button', { name: 'Elegir este material', exact: true }),
  )
  await usuario.click(screen.getByRole('button', { name: /Elegir: BIB-000005/ }))
  await usuario.click(screen.getByRole('button', { name: 'Revisar préstamo' }))
  expect(registrarPrestamo).not.toHaveBeenCalled()
  await usuario.click(
    await screen.findByRole('button', { name: 'Sí, registrar préstamo' }),
  )
  await waitFor(() => expect(registrarPrestamo).toHaveBeenCalledTimes(1))
  expect(vi.mocked(registrarPrestamo).mock.calls[0][0].personaId).toBe(9)
})
