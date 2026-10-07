import { BookOpen } from 'lucide-react'

interface Props {
  /** Texto principal de carga. */
  mensaje?: string
  /** Subtexto explicativo tranquilizador. */
  subtexto?: string
  /** Si es true, ocupa toda la altura disponible con centrado. */
  pantallaCompleta?: boolean
}

export function IndicadorCarga({
  mensaje = 'Cargando datos…',
  subtexto = 'Un momento por favor, el sistema está preparando la información.',
  pantallaCompleta = false,
}: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center p-8 ${
        pantallaCompleta ? 'min-h-[60vh]' : 'min-h-[220px]'
      }`}
    >
      {/* Contenedor animado con spinner suave y libro */}
      <div className="relative mb-5 flex items-center justify-center">
        {/* Anillo de rotación suave con verde biblioteca */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-borde border-t-primario" />

        {/* Icono central de libro con pulso sutil */}
        <div className="absolute text-primario animate-pulse">
          <BookOpen aria-hidden size={26} />
        </div>
      </div>

      {/* Textos con alto contraste y claridad */}
      <p className="text-2xl font-bold text-tinta">{mensaje}</p>
      {subtexto && (
        <p className="text-tinta-suave text-lg mt-1 max-w-md">{subtexto}</p>
      )}
    </div>
  )
}
