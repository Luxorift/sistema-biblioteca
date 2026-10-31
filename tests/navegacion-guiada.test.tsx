import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { PrestarPage } from '@/features/prestamos/PrestarPage'
import { irAlPaso } from '@/lib/guiarNavegacion'
import {
  obtenerMaterialesPrestables,
  obtenerPersonasActivas,
} from '@/features/prestamos/api'

vi.mock('@/features/prestamos/api', () => ({
  obtenerMaterialesPrestables: vi.fn(),
  obtenerPersonasActivas: vi.fn(),
  registrarPrestamo: vi.fn(),
}))
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

it('guía de material a persona, copias y fechas sin desplazar la pantalla al escribir o antes de completar las copias', async () => {
  const desplazar = vi.fn()
  HTMLElement.prototype.scrollIntoView = desplazar
  vi.mocked(obtenerMaterialesPrestables).mockResolvedValue([
    {
      id: 1,
      titulo: 'Libro de prueba',
      editorial: null,
      anio: null,
      tipo: 'Libro',
      categoria: null,
      autores: [],
      cantidadCopias: 2,
      copias: [
        {
          id: 1,
          codigo: 'BIB-000001',
          titulo: 'Libro de prueba',
          ubicacion: 'Estante A',
        },
        {
          id: 2,
          codigo: 'BIB-000002',
          titulo: 'Libro de prueba',
          ubicacion: 'Estante B',
        },
      ],
    },
  ])
  vi.mocked(obtenerPersonasActivas).mockResolvedValue([
    { id: 1, nombreCompleto: 'Pérez, Ana', dni: '12345678', tipo: 'Estudiante' },
  ])
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <MemoryRouter>
        <PrestarPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  const usuario = userEvent.setup()
  await usuario.click(await screen.findByRole('button', { name: 'Elegir este material' }))
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('region', { name: 'Elegir persona' }),
    ),
  )
  const antesDeEscribir = desplazar.mock.calls.length
  await usuario.type(screen.getByLabelText('Filtrar personas'), 'Ana')
  expect(desplazar).toHaveBeenCalledTimes(antesDeEscribir)
  await usuario.click(screen.getByRole('button', { name: 'Elegir esta persona' }))
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('region', { name: 'Elegir copias' }),
    ),
  )
  await usuario.clear(screen.getByLabelText('Cantidad de copias a prestar'))
  await usuario.type(screen.getByLabelText('Cantidad de copias a prestar'), '2')
  const antesDeCompletar = desplazar.mock.calls.length
  await usuario.click(screen.getByRole('button', { name: /Elegir: BIB-000001/ }))
  expect(desplazar).toHaveBeenCalledTimes(antesDeCompletar)
  await usuario.click(screen.getByRole('button', { name: /Elegir: BIB-000002/ }))
  await waitFor(() =>
    expect(document.activeElement).toBe(
      screen.getByRole('region', { name: 'Fechas y revisión' }),
    ),
  )
  expect(
    screen
      .getByRole('button', { name: /4. Fechas y revisión/ })
      .getAttribute('aria-current'),
  ).toBe('step')
  await usuario.click(screen.getByRole('button', { name: 'Material elegido' }))
  expect(screen.getByRole('button', { name: /Seleccionada: BIB-000001/ })).toBeTruthy()
  expect(screen.getByRole('button', { name: /Seleccionada: BIB-000002/ })).toBeTruthy()
})

it('respeta la preferencia de reducir movimiento al cambiar de paso', async () => {
  vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
  const desplazar = vi.fn()
  HTMLElement.prototype.scrollIntoView = desplazar
  const referencia = createRef<HTMLElement>()
  render(<section ref={referencia} tabIndex={-1} aria-label="Siguiente paso" />)
  irAlPaso(referencia)
  await waitFor(() =>
    expect(desplazar).toHaveBeenCalledWith({ behavior: 'instant', block: 'start' }),
  )
  expect(document.activeElement).toBe(referencia.current)
})

it('descarta el desplazamiento si la sección dejó de existir antes del render', () => {
  let siguienteFrame: FrameRequestCallback | undefined
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    siguienteFrame = callback
    return 1
  })
  const desplazar = vi.fn()
  HTMLElement.prototype.scrollIntoView = desplazar
  const referencia = createRef<HTMLElement>()
  const vista = render(<section ref={referencia} tabIndex={-1} />)
  irAlPaso(referencia)
  vista.unmount()
  siguienteFrame!(0)
  expect(desplazar).not.toHaveBeenCalled()
})
