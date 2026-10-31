import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { ConsultarCredencial } from '@/features/personas/components/ConsultarCredencial'
import { CredencialesPage } from '@/features/personas/CredencialesPage'
import { consultarCredencial, obtenerPersonas } from '@/features/personas/api'
import type { ConsultaCredencial, Persona } from '@/features/personas/types'

vi.mock('@/features/personas/api', () => ({
  consultarCredencial: vi.fn(),
  obtenerPersonas: vi.fn(),
}))

const persona: Persona = {
  id: 1,
  codigo: 'PER-000001',
  nombres: 'Ana',
  apellidoPaterno: 'Pérez',
  apellidoMaterno: null,
  dni: '12345678',
  correo: null,
  tipoPersonaId: 1,
  tipoPersona: 'Estudiante',
  activo: true,
}
const credencial: ConsultaCredencial = {
  persona,
  pendientes: 1,
  atrasados: 1,
  maxDiasAtraso: 2,
  prestamos: [
    {
      id: 15,
      codigo: 'BIB-000001',
      titulo: 'El principito',
      fechaPrestamo: '2026-10-01',
      fechaLimite: '2026-10-10',
      estaAtrasado: true,
      diasAtraso: 2,
    },
  ],
}

function montar(elemento: React.ReactNode, ruta = '/prestamos') {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const vista = render(
    <QueryClientProvider client={cliente}>
      <MemoryRouter initialEntries={[ruta]}>{elemento}</MemoryRouter>
    </QueryClientProvider>,
  )
  return { ...vista, cliente }
}
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
beforeEach(() => {
  vi.mocked(consultarCredencial).mockReset()
  vi.mocked(obtenerPersonas).mockReset()
})

describe('atención por credencial', () => {
  it('acepta un escáner con Enter, muestra atrasos y permite elegir a la persona', async () => {
    vi.mocked(consultarCredencial).mockResolvedValue(credencial)
    const elegir = vi.fn()
    montar(<ConsultarCredencial onPrestar={elegir} />)
    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Código de credencial'), 'per-000001{Enter}')
    await screen.findByText('El principito · BIB-000001')
    expect(consultarCredencial).toHaveBeenCalledWith('PER-000001')
    expect(screen.getByText('Préstamos pendientes: 1. Atrasados: 1.')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Devolver BIB-000001' }).getAttribute('href'),
    ).toBe('/prestamos?tab=devolver&prestamoId=15')
    await usuario.click(screen.getByRole('button', { name: 'Prestar a esta persona' }))
    expect(elegir).toHaveBeenCalledWith(persona)
  })

  it('informa una credencial inexistente y bloquea nuevos préstamos a personas inactivas', async () => {
    vi.mocked(consultarCredencial)
      .mockResolvedValueOnce(null)
      .mockResolvedValue({ ...credencial, persona: { ...persona, activo: false } })
    montar(<ConsultarCredencial onPrestar={vi.fn()} />)
    const usuario = userEvent.setup()
    const campo = screen.getByLabelText('Código de credencial')
    await usuario.type(campo, 'PER-999999{Enter}')
    await screen.findByText('No existe una persona con ese código. Revisa la credencial.')
    await usuario.clear(campo)
    await usuario.type(campo, 'PER-000001{Enter}')
    await screen.findByText(/Esta persona está inactiva/)
    expect(
      (
        screen.getByRole('button', {
          name: 'Prestar a esta persona',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
    expect(screen.getByRole('link', { name: 'Devolver BIB-000001' })).toBeTruthy()
  })

  it('rechaza códigos de libros y retira los datos de la consulta anterior', async () => {
    vi.mocked(consultarCredencial).mockResolvedValue(credencial)
    montar(<ConsultarCredencial onPrestar={vi.fn()} />)
    const usuario = userEvent.setup()
    const campo = screen.getByLabelText('Código de credencial')
    await usuario.type(campo, 'PER-000001{Enter}')
    await screen.findByText('El principito · BIB-000001')
    await usuario.clear(campo)
    await usuario.type(campo, 'BIB-000001{Enter}')
    expect(screen.getByText(/Escanea una credencial de persona/)).toBeTruthy()
    expect(screen.queryByText('El principito · BIB-000001')).toBeNull()
    expect(consultarCredencial).toHaveBeenCalledTimes(1)
  })

  it('vuelve a consultar el mismo código para mostrar las devoluciones recientes', async () => {
    vi.mocked(consultarCredencial)
      .mockResolvedValueOnce(credencial)
      .mockResolvedValue({ ...credencial, pendientes: 0, atrasados: 0, prestamos: [] })
    montar(<ConsultarCredencial onPrestar={vi.fn()} />)
    const usuario = userEvent.setup()
    await usuario.type(screen.getByLabelText('Código de credencial'), 'PER-000001{Enter}')
    await screen.findByText('El principito · BIB-000001')
    await usuario.click(screen.getByRole('button', { name: 'Consultar credencial' }))
    await screen.findByText('No tiene libros pendientes de devolución.')
    expect(consultarCredencial).toHaveBeenCalledTimes(2)
  })
})

describe('impresión de credenciales', () => {
  it('preselecciona una credencial desde personas y genera su código de barras', async () => {
    vi.mocked(obtenerPersonas).mockResolvedValue({ personas: [persona], total: 1 })
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {})
    montar(<CredencialesPage />, '/credenciales?codigo=PER-000001')
    const boton = await screen.findByRole('button', { name: 'Imprimir credenciales (1)' })
    const codigo = screen.getByLabelText('Código de barras Code 128 para PER-000001')
    await waitFor(() => expect(codigo.querySelectorAll('rect').length).toBeGreaterThan(0))
    await userEvent.click(boton)
    expect(imprimir).toHaveBeenCalledTimes(1)
  })

  it('conserva la selección al cambiar de página e impide imprimir una selección vacía', async () => {
    const segunda = { ...persona, id: 26, codigo: 'PER-000026', nombres: 'Luis' }
    vi.mocked(obtenerPersonas).mockImplementation(async (filtros) => ({
      personas: [filtros.pagina === 0 ? persona : segunda],
      total: 26,
    }))
    montar(<CredencialesPage />)
    expect(
      (
        screen.getByRole('button', {
          name: 'Imprimir credenciales (0)',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
    const usuario = userEvent.setup()
    await usuario.click(await screen.findByLabelText('Seleccionar PER-000001'))
    await usuario.click(screen.getByRole('button', { name: 'Siguiente' }))
    await usuario.click(await screen.findByLabelText('Seleccionar PER-000026'))
    expect(screen.getByRole('button', { name: 'Imprimir credenciales (2)' })).toBeTruthy()
    await usuario.click(screen.getByRole('button', { name: 'Limpiar selección' }))
    expect(
      (
        screen.getByRole('button', {
          name: 'Imprimir credenciales (0)',
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true)
  })
})
