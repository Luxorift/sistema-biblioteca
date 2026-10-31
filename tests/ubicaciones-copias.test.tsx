import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormularioMaterial } from '@/features/materiales/components/FormularioMaterial'
import {
  esquemaMaterial,
  type FormularioMaterial as DatosFormulario,
} from '@/features/materiales/schemas'
import {
  completarUbicaciones,
  exigirUbicaciones,
} from '@/features/materiales/ubicacionesCopias'
import { EditarMaterialDialog } from '@/features/buscar-materiales/components/EditarMaterialDialog'
import { AgregarMaterialPage } from '@/features/materiales/AgregarMaterialPage'

const { guardarEdicion, agregarCopias } = vi.hoisted(() => ({
  guardarEdicion: vi.fn(),
  agregarCopias: vi.fn(),
}))
vi.mock('@/features/materiales/useMateriales', () => ({
  useRegistrarMaterial: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useAgregarEjemplares: () => ({ mutateAsync: agregarCopias, isPending: false }),
  useSimilares: () => ({
    data: [
      {
        id: 1,
        titulo: 'Libro existente',
        editorial: null,
        anio_publicacion: null,
        similitud: 1,
        copias: 1,
      },
    ],
    isLoading: false,
    isError: false,
  }),
}))
const ubicaciones = [
  { id: 1, estante: 'A', nivel: 1 },
  { id: 2, estante: 'B', nivel: 2 },
]
vi.mock('@/features/buscar-materiales/useActualizarMaterial', () => ({
  useActualizarMaterial: () => ({ mutateAsync: guardarEdicion, isPending: false }),
}))
vi.mock('@/features/catalogos', () => ({
  useCatalogo: () => ({ data: [{ id: 1, nombre: 'Libro' }], isLoading: false }),
  useEditoriales: () => ({ data: [], isLoading: false }),
  useUbicaciones: () => ({
    data: [
      { id: 1, estante: 'A', nivel: 1 },
      { id: 2, estante: 'B', nivel: 2 },
    ],
    isLoading: false,
  }),
}))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

function Registro({ onEnviar }: { onEnviar: (datos: DatosFormulario) => void }) {
  const formulario = useForm<DatosFormulario>({
    resolver: zodResolver(esquemaMaterial),
    defaultValues: {
      titulo: 'Libro de prueba',
      tipoMaterialId: 1,
      categoriaId: null,
      editorial: '',
      anio: null,
      autores: [],
      cantidad: 2,
      ubicacionesIds: [null],
    },
  })
  return (
    <FormularioMaterial
      formulario={formulario}
      tipos={[{ id: 1, nombre: 'Libro' }]}
      categorias={[]}
      ubicaciones={ubicaciones}
      editoriales={[]}
      cargandoCatalogos={false}
      onNuevo={vi.fn()}
      onEnviar={onEnviar}
      guardando={false}
    />
  )
}

it('exige ubicaciones al registrar y permite combinar ubicaciones en un mismo lote', async () => {
  const enviar = vi.fn()
  render(<Registro onEnviar={enviar} />)
  const usuario = userEvent.setup()
  await usuario.click(screen.getByRole('button', { name: 'Revisar material y copias' }))
  await screen.findByText('Indica la ubicación de cada copia nueva.')
  expect(enviar).not.toHaveBeenCalled()
  await usuario.selectOptions(
    screen.getByLabelText('Ubicación para todas las copias nuevas'),
    '1',
  )
  await usuario.click(screen.getByText(/Asignar una ubicación distinta por copia/))
  await usuario.selectOptions(screen.getByLabelText('Ubicación de copia nueva 2'), '2')
  await usuario.click(screen.getByRole('button', { name: 'Revisar material y copias' }))
  await waitFor(() => expect(enviar).toHaveBeenCalledTimes(1))
  expect(enviar.mock.calls[0][0].ubicacionesIds).toEqual([1, 2])
})

it('comparte una ubicación al ampliar el lote, pero exige elegir las adicionales si ya estaban repartidas', () => {
  expect(exigirUbicaciones(3, [1])).toEqual([1, 1, 1])
  expect(completarUbicaciones(3, [1, 2])).toEqual([1, 2, null])
  expect(() => exigirUbicaciones(3, [1, 2])).toThrow(/ubicación/)
  expect(exigirUbicaciones(1, [1, 2])).toEqual([1])
})

it('al agregar a un material existente guarda las ubicaciones actuales del formulario', async () => {
  agregarCopias.mockResolvedValue([
    { id: 3, codigo: 'BIB-000003', material_id: 1, ubicacion_id: 2 },
  ])
  render(
    <MemoryRouter>
      <AgregarMaterialPage />
    </MemoryRouter>,
  )
  const usuario = userEvent.setup()
  await usuario.type(screen.getByLabelText('Título'), 'Libro')
  await usuario.selectOptions(
    screen.getByLabelText('Ubicación para todas las copias nuevas'),
    '1',
  )
  await usuario.click(
    await screen.findByRole('button', { name: 'Agregar copias a este' }),
  )
  // Cambiarla después de elegir el material no debe reutilizar una selección antigua.
  await usuario.selectOptions(
    screen.getByLabelText('Ubicación para todas las copias nuevas'),
    '2',
  )
  await usuario.click(screen.getByRole('button', { name: 'Sí, agregar copias' }))
  await waitFor(() =>
    expect(agregarCopias).toHaveBeenCalledWith({ materialId: 1, ubicacionesIds: [2] }),
  )
  expect(await screen.findByText('Material guardado')).toBeTruthy()
})

it('editar material exige ubicaciones solo para las copias nuevas y las envía al guardar', async () => {
  guardarEdicion.mockResolvedValue(undefined)
  HTMLDialogElement.prototype.showModal = function () {
    this.open = true
  }
  HTMLDialogElement.prototype.close = function () {
    this.open = false
  }
  render(
    <MemoryRouter>
      <EditarMaterialDialog
        abierto
        onCerrar={vi.fn()}
        onGuardado={vi.fn()}
        material={{
          id: 1,
          titulo: 'Libro de prueba',
          tipoMaterialId: 1,
          tipo: 'Libro',
          categoriaId: null,
          categoria: null,
          editorial: null,
          anio: null,
          autores: [],
          copias: [
            {
              id: 1,
              codigo: 'BIB-000001',
              estado: 'disponible',
              ubicacion: 'Estante A, nivel 1',
            },
          ],
        }}
      />
    </MemoryRouter>,
  )
  expect(screen.queryByLabelText('Ubicación para todas las copias nuevas')).toBeNull()
  const usuario = userEvent.setup()
  await usuario.clear(screen.getByLabelText('Copias activas'))
  await usuario.type(screen.getByLabelText('Copias activas'), '3')
  await usuario.click(screen.getByRole('button', { name: 'Revisar y guardar' }))
  await screen.findByText('Indica la ubicación de cada copia nueva.')
  expect(guardarEdicion).not.toHaveBeenCalled()
  await usuario.selectOptions(
    screen.getByLabelText('Ubicación para todas las copias nuevas'),
    '2',
  )
  await usuario.click(screen.getByRole('button', { name: 'Revisar y guardar' }))
  await usuario.click(await screen.findByRole('button', { name: 'Sí, guardar cambios' }))
  await waitFor(() => expect(guardarEdicion).toHaveBeenCalledTimes(1))
  expect(guardarEdicion.mock.calls[0][0].datos.ubicacionesNuevas).toEqual([2, 2])
})
