import type { CopiaParaEtiqueta, FormatoEtiqueta } from '../types'
import { CodigoBarras } from './CodigoBarras'
import { CodigoQR } from './CodigoQR'

interface EtiquetaImprimibleProps {
  copia: CopiaParaEtiqueta
  formato: FormatoEtiqueta
}

export function EtiquetaImprimible({ copia, formato }: EtiquetaImprimibleProps) {
  const autoresTexto = copia.autores.join(', ')

  return (
    <article
      className="border-tinta flex h-full flex-col justify-between rounded-lg border-2 bg-white p-3 text-black break-inside-avoid print:border-black print:p-2.5"
      style={{ minHeight: '160px' }}
    >
      {/* Encabezado */}
      <div>
        <header className="mb-1 border-b border-gray-300 pb-1 text-center">
          <p className="text-[11px] font-bold tracking-wider uppercase text-gray-700">
            Biblioteca Escolar
          </p>
        </header>

        {/* Título y autor */}
        <div className="mb-2 text-center">
          <h3
            className="text-sm leading-tight font-bold text-gray-900"
            title={copia.titulo}
          >
            {copia.titulo}
          </h3>
          {autoresTexto && (
            <p className="truncate text-[11px] text-gray-600">
              {autoresTexto}
            </p>
          )}
        </div>
      </div>

      {/* Códigos ópticos según formato elegido */}
      <div className="my-1 flex flex-col items-center justify-center">
        {formato === 'barras' && (
          <div className="flex flex-col items-center">
            <CodigoBarras codigo={copia.codigo} ancho={1.7} alto={40} />
            <span className="mt-1 font-mono text-base font-black tracking-wider text-black">
              {copia.codigo}
            </span>
          </div>
        )}

        {formato === 'qr' && (
          <div className="flex flex-col items-center">
            <CodigoQR codigo={copia.codigo} tamano={75} />
            <span className="mt-1 font-mono text-base font-black tracking-wider text-black">
              {copia.codigo}
            </span>
          </div>
        )}

        {formato === 'ambos' && (
          <div className="flex w-full items-center justify-between gap-2">
            <div className="shrink-0">
              <CodigoQR codigo={copia.codigo} tamano={64} />
            </div>
            <div className="flex flex-1 flex-col items-center overflow-hidden">
              <CodigoBarras codigo={copia.codigo} ancho={1.3} alto={34} />
              <span className="mt-0.5 font-mono text-sm font-black tracking-wider text-black">
                {copia.codigo}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Pie de etiqueta con ubicación */}
      <footer className="mt-1 border-t border-gray-200 pt-1 text-center">
        <p className="truncate text-[11px] font-semibold text-gray-700">
          {copia.ubicacion ? copia.ubicacion : copia.tipo}
        </p>
      </footer>
    </article>
  )
}
