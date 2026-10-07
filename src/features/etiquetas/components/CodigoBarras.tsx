import JsBarcode from 'jsbarcode'
import { useEffect, useRef } from 'react'

interface CodigoBarrasProps {
  codigo: string
  ancho?: number
  alto?: number
  mostrarTexto?: boolean
}

export function CodigoBarras({
  codigo,
  ancho = 1.6,
  alto = 42,
  mostrarTexto = false,
}: CodigoBarrasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    if (svgRef.current && codigo) {
      try {
        JsBarcode(svgRef.current, codigo, {
          format: 'CODE128',
          lineColor: '#000000',
          width: ancho,
          height: alto,
          displayValue: mostrarTexto,
          font: 'monospace',
          fontSize: 14,
          margin: 0,
        })
      } catch {
        // En caso de que el valor no sea codificable
      }
    }
  }, [codigo, ancho, alto, mostrarTexto])

  return (
    <svg
      ref={svgRef}
      className="max-w-full overflow-visible"
      aria-label={`Código de barras Code 128 para ${codigo}`}
    />
  )
}
