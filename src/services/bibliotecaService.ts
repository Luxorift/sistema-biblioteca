import { supabase } from './supabase/client'

export type Material = { id: string; titulo: string; tipo: string; estado: string; detalles_extra: Record<string, unknown> | null }
export type Miembro = { id: string; nombre_completo: string; tipo: string; codigo: string; contacto: string | null }
export type PrestamoActivo = {
  id: string
  material: string
  miembro: string
  estado: string
  fechas: Record<string, string> | null
  materiales: { titulo: string } | null
  miembros: { nombre_completo: string; codigo: string } | null
}

export async function getMaterialesDisponibles() {
  const { data, error } = await supabase
    .from('materiales')
    .select('id, titulo, tipo, estado, detalles_extra')
    .eq('estado', 'Disponible')
    .order('titulo')

  if (error) throw error
  return (data ?? []) as Material[]
}

export async function getMateriales() {
  const { data, error } = await supabase
    .from('materiales')
    .select('id, titulo, tipo, estado, detalles_extra')
    .order('titulo')

  if (error) throw error
  return (data ?? []) as Material[]
}

export async function getMiembros() {
  const { data, error } = await supabase
    .from('miembros')
    .select('id, nombre_completo, tipo, codigo, contacto')
    .order('nombre_completo')

  if (error) throw error
  return (data ?? []) as Miembro[]
}

export async function getPrestamosActivos() {
  const { data, error } = await supabase
    .from('prestamos')
    .select('id, material, miembro, estado, fechas, materiales(titulo), miembros(nombre_completo, codigo)')
    .eq('estado', 'Activo')

  if (error) throw error
  return (data ?? []) as unknown as PrestamoActivo[]
}

export async function searchBiblioteca(searchTerm: string) {
  const normalizedTerm = searchTerm.trim().toLocaleLowerCase()
  if (!normalizedTerm) return { materiales: [] as Material[], miembros: [] as Miembro[] }

  // Se filtra el JSON en el cliente para permitir búsquedas en cualquier dato extra
  // existente (autor, ISBN, editorial, etc.) sin acoplar la UI a una clave concreta.
  const [materiales, miembros] = await Promise.all([getMateriales(), getMiembros()])
  return {
    materiales: materiales.filter((material) =>
      `${material.titulo} ${JSON.stringify(material.detalles_extra ?? {})}`.toLocaleLowerCase().includes(normalizedTerm),
    ),
    miembros: miembros.filter((miembro) =>
      `${miembro.nombre_completo} ${miembro.codigo}`.toLocaleLowerCase().includes(normalizedTerm),
    ),
  }
}

export async function registrarPrestamo(materialId: string, miembroId: string, bibliotecarioId: string) {
  const now = new Date().toISOString()
  const { error } = await supabase.from('prestamos').insert({
    material: materialId,
    miembro: miembroId,
    bibliotecario: bibliotecarioId,
    estado: 'Activo',
    fechas: { fecha_prestamo: now },
  })

  if (error) throw error

  const { error: materialError } = await supabase
    .from('materiales')
    .update({ estado: 'Prestado' })
    .eq('id', materialId)

  if (materialError) throw materialError
}

export async function marcarDevuelto(prestamoId: string, materialId: string) {
  const { error } = await supabase
    .from('prestamos')
    .update({ estado: 'Devuelto', fecha_entregado: new Date().toISOString() })
    .eq('id', prestamoId)
    .eq('estado', 'Activo')

  if (error) throw error

  const { error: materialError } = await supabase
    .from('materiales')
    .update({ estado: 'Disponible' })
    .eq('id', materialId)

  if (materialError) throw materialError
}
