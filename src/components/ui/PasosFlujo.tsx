interface PasoFlujo {
  titulo: string
  completado: boolean
  habilitado?: boolean
  onIr: () => void
}

interface PasosFlujoProps {
  pasos: PasoFlujo[]
  pasoActual: number
  siguiente: string
}

export function PasosFlujo({ pasos, pasoActual, siguiente }: PasosFlujoProps) {
  return (
    <div className="border-borde space-y-3 rounded-2xl border-2 bg-white p-4">
      <nav aria-label="Pasos del préstamo">
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {pasos.map((paso, indice) => (
            <li key={paso.titulo}>
              <button
                type="button"
                onClick={paso.onIr}
                disabled={paso.habilitado === false}
                aria-current={indice === pasoActual ? 'step' : undefined}
                className={`min-h-12 w-full rounded-xl border-2 px-3 py-2 text-left font-bold disabled:cursor-not-allowed disabled:opacity-55 ${indice === pasoActual ? 'border-primario bg-papel text-tinta' : 'border-borde text-tinta'}`}
              >
                <span className="block">
                  {indice + 1}. {paso.titulo}
                </span>
                <span className="text-tinta-suave text-sm font-normal">
                  {paso.completado
                    ? 'Completado · puedes revisarlo'
                    : indice === pasoActual
                      ? 'Paso actual'
                      : 'Pendiente'}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <p role="status" className="text-lg">
        <strong>Siguiente paso:</strong> {siguiente}
      </p>
    </div>
  )
}
