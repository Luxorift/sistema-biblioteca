import { Barcode, BookDown, BookPlus, BookUp, Search, UsersRound, type LucideIcon } from 'lucide-react'

export interface AccionInicio {
  id: string
  titulo: string
  descripcion: string
  ruta: string
  icono: LucideIcon
  /** Clase de color de fondo (token "lomo" definido en styles/index.css). */
  color: string
}

// Las tareas del día a día. Para agregar o cambiar una, se edita solo esta lista.
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
  {
    id: 'personas',
    titulo: 'Personas',
    descripcion: 'Registra a docentes, alumnos y personal.',
    ruta: '/personas',
    icono: UsersRound,
    color: 'bg-lomo-morado',
  },
  {
    id: 'etiquetas',
    titulo: 'Etiquetas',
    descripcion: 'Imprime códigos de barra y QR para libros.',
    ruta: '/etiquetas',
    icono: Barcode,
    color: 'bg-lomo-azul',
  },
]
