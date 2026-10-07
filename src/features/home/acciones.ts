import {
  Barcode,
  BookOpen,
  BookUp,
  FolderKanban,
  UserCog,
  UsersRound,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export interface AccionInicio {
  id: string
  titulo: string
  descripcion: string
  ruta: string
  icono: LucideIcon
  /** Clase de color de fondo (token "lomo" definido en styles/index.css). */
  color: string
  /** Si es true, solo los usuarios con rol 'admin' ven esta acción. */
  soloAdmin?: boolean
}

// Las tareas del día a día organizadas por flujos de trabajo principales.
export const accionesInicio: AccionInicio[] = [
  {
    id: 'materiales',
    titulo: 'Materiales y libros',
    descripcion: 'Busca libros en el inventario o registra obras nuevas.',
    ruta: '/materiales',
    icono: BookOpen,
    color: 'bg-lomo-verde',
  },
  {
    id: 'prestamos',
    titulo: 'Préstamos y devoluciones',
    descripcion: 'Mostrador de atención: presta, recibe libros y revisa morosos.',
    ruta: '/prestamos',
    icono: BookUp,
    color: 'bg-lomo-azul',
  },
  {
    id: 'personas',
    titulo: 'Personas',
    descripcion: 'Registra a docentes, alumnos y personal escolar.',
    ruta: '/personas',
    icono: UsersRound,
    color: 'bg-lomo-morado',
  },
  {
    id: 'ejemplares',
    titulo: 'Mantenimiento de copias',
    descripcion: 'Control de ejemplares físicos, bajas y reparaciones.',
    ruta: '/ejemplares',
    icono: Wrench,
    color: 'bg-lomo-ocre',
  },
  {
    id: 'etiquetas',
    titulo: 'Etiquetas',
    descripcion: 'Imprime códigos de barra y QR para libros.',
    ruta: '/etiquetas',
    icono: Barcode,
    color: 'bg-lomo-azul',
  },
  {
    id: 'catalogos',
    titulo: 'Catálogos del sistema',
    descripcion: 'Administra tipos de material, categorías, editoriales y estantes.',
    ruta: '/catalogos',
    icono: FolderKanban,
    color: 'bg-lomo-vino',
  },
  {
    id: 'usuarios',
    titulo: 'Usuarios y accesos',
    descripcion: 'Administra cuentas y permisos de administradores y bibliotecarios.',
    ruta: '/usuarios',
    icono: UserCog,
    color: 'bg-lomo-morado',
    soloAdmin: true,
  },
]
