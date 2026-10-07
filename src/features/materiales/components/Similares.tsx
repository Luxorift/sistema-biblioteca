import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import type { MaterialSimilar } from '../types'

interface SimilaresProps {
  materiales: MaterialSimilar[]
  cargando: boolean
  error: boolean
  onAgregarCopias: (material: MaterialSimilar) => void
}
export function Similares({
  materiales,
  cargando,
  error,
  onAgregarCopias,
}: SimilaresProps) {
  if (cargando)
    return (
      <p className="text-tinta-suave" aria-live="polite">
        Buscando materiales parecidos…
      </p>
    )
  if (error)
    return (
      <Alert>
        No se pudo buscar materiales parecidos. Puedes seguir llenando el formulario e
        intentar guardar.
      </Alert>
    )
  if (!materiales.length) return null
  return (
    <section
      aria-labelledby="similares"
      className="border-borde space-y-3 rounded-2xl border-2 bg-white p-5"
    >
      <h2 id="similares" className="text-2xl font-bold">
        Ya tienes algo parecido
      </h2>
      <p className="text-tinta-suave">
        Revísalo antes de crear otra ficha. Si no es el mismo material, puedes continuar.
      </p>
      <div className="space-y-3">
        {materiales.map((material) => (
          <article
            key={material.id}
            className="border-borde flex flex-wrap items-center justify-between gap-4 border-t-2 pt-3"
          >
            <p>
              <strong className="block text-xl">{material.titulo}</strong>
              <span>
                {material.editorial ?? 'Sin editorial'} ·{' '}
                {material.anio_publicacion ?? 'Sin año'} · {material.copias}{' '}
                {material.copias === 1 ? 'copia' : 'copias'}
              </span>
            </p>
            <Button variante="secundario" onClick={() => onAgregarCopias(material)}>
              Agregar copias a este
            </Button>
          </article>
        ))}
      </div>
    </section>
  )
}
