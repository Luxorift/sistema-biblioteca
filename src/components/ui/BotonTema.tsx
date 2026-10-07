import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'

interface BotonTemaProps {
  /** Si es true, muestra solo el ícono con un tooltip/aria-label accesible. */
  compacto?: boolean
}

export function BotonTema({ compacto = false }: BotonTemaProps) {
  const { tema, alternarTema } = useTheme()
  const esOscuro = tema === 'oscuro'

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={esOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className="border-borde inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 bg-white px-3.5 sm:px-4 py-2 text-base sm:text-lg font-bold text-tinta shadow-xs transition-all duration-150 ease-in-out hover:bg-papel active:scale-[0.98]"
    >
      {esOscuro ? (
        <>
          <Moon aria-hidden size={22} className="text-amber-400" />
          {!compacto && <span className="hidden sm:inline">Modo Claro</span>}
        </>
      ) : (
        <>
          <Sun aria-hidden size={22} className="text-amber-600" />
          {!compacto && <span className="hidden sm:inline">Modo Oscuro</span>}
        </>
      )}
    </button>
  )
}
