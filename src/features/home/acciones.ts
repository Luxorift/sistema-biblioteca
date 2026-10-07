import { BookDown, BookPlus, BookUp, Search, type LucideIcon } from 'lucide-react'

export interface AccionInicio {
  id: string
  titulo: string
  descripcion: string
  ruta: string
  icono: LucideIcon
  /** Clase de color de fondo (token "lomo" definido en styles/index.css). */
  color: string
}

// Las cuatro tareas del día a día. Para agregar o cambiar una, se edita solo esta lista.
export const accionesInicio: AccionInicio[] = [
  {
    id: 'buscar',
    titulo: 'Buscar material',
    descripcion: 'Encuentra un libro por título o autor.',
    ruta: '/buscar',
    icono: Search,
    color: 'bg-lomo-verde',
  },
  {
    id: 'prestar',
    titulo: 'Prestar',
    descripcion: 'Entrega un material a una persona.',
    ruta: '/prestar',
    icono: BookUp,
    color: 'bg-lomo-azul',
  },
  {
    id: 'devolver',
    titulo: 'Devolver',
    descripcion: 'Recibe un material que regresa.',
    ruta: '/devolver',
    icono: BookDown,
    color: 'bg-lomo-vino',
  },
  {
    id: 'agregar',
    titulo: 'Agregar material',
    descripcion: 'Registra un libro o una obra nueva.',
    ruta: '/agregar',
    icono: BookPlus,
    color: 'bg-lomo-ocre',
  },
]
