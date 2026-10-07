export interface OpcionCatalogo {
  id: number
  nombre: string
}

export interface Ubicacion {
  id: number
  estante: string
  nivel: number
}

// Mantener compatibilidad con uso previo
export type TipoCatalogo = 'tipos_material' | 'categorias'

// Catálogos simples basados en id + nombre
export type TipoCatalogoSimple =
  | 'tipos_material'
  | 'categorias'
  | 'editoriales'
  | 'autores'
  | 'tipos_persona'

// Todas las secciones administrables
export type CatalogoSeccion = TipoCatalogoSimple | 'ubicaciones'

export interface MetaCatalogo {
  id: CatalogoSeccion
  titulo: string
  singular: string
  descripcion: string
  placeholder: string
}

export const CATALOGOS_DISPONIBLES: MetaCatalogo[] = [
  {
    id: 'tipos_material',
    titulo: 'Tipos de material',
    singular: 'tipo de material',
    descripcion: 'Formatos físicos de los materiales (libro, enciclopedia, revista, lámina, etc.).',
    placeholder: 'Ej: Enciclopedia, Diccionario, Obra literaria',
  },
  {
    id: 'categorias',
    titulo: 'Categorías temáticas',
    singular: 'categoría',
    descripcion: 'Áreas temáticas o clasificaciones de los libros (ciencias, literatura, historia, etc.).',
    placeholder: 'Ej: Ciencias Sociales, Matemática, Plan Lector',
  },
  {
    id: 'editoriales',
    titulo: 'Editoriales',
    singular: 'editorial',
    descripcion: 'Casas editoras de las obras registradas en el inventario.',
    placeholder: 'Ej: Santillana, Norma, SM, Editorial Navarrete',
  },
  {
    id: 'autores',
    titulo: 'Autores',
    singular: 'autor',
    descripcion: 'Escritores, creadores o entidades autoras de los libros y materiales.',
    placeholder: 'Ej: Mario Vargas Llosa, César Vallejo, MINEDU',
  },
  {
    id: 'ubicaciones',
    titulo: 'Ubicaciones físicas',
    singular: 'ubicación',
    descripcion: 'Distribución física en la sala: estante (letra A-Z) y nivel (piso o balda 1-9).',
    placeholder: 'Estante y nivel',
  },
  {
    id: 'tipos_persona',
    titulo: 'Tipos de persona',
    singular: 'tipo de persona',
    descripcion: 'Clasificación de quienes reciben préstamos (docentes, estudiantes, personal, etc.).',
    placeholder: 'Ej: Docente, Alumno de Primaria, Auxiliar de Educación',
  },
]
