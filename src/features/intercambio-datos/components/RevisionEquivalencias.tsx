import { RevisarGrupo } from './RevisarGrupo'
import type {
  ContextoImportacion,
  DecisionEquivalencia,
  GrupoEquivalencias,
} from '../types'

export function RevisionEquivalencias({
  grupos,
  decisiones,
  onDecidir,
  contexto,
}: {
  grupos: GrupoEquivalencias[]
  decisiones: Record<string, DecisionEquivalencia>
  onDecidir: (id: string, valor: DecisionEquivalencia | null) => void
  contexto: ContextoImportacion
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">2. Elige cómo unificar los nombres</h2>
      <p>
        Una decisión se aplica a todas las filas afectadas. Los nombres parecidos son
        sugerencias: pueden representar entidades diferentes.
      </p>
      <p className="text-tinta-suave">
        Se reutilizan los catálogos existentes. Esta importación no renombra ni fusiona
        fichas ya registradas.
      </p>
      {!grupos.length && <p>No se encontraron grupos que requieran una decisión.</p>}
      {grupos.map((grupo) => (
        <RevisarGrupo
          key={grupo.id}
          grupo={grupo}
          decision={decisiones[grupo.id]}
          onDecidir={(d) => onDecidir(grupo.id, d)}
          contexto={contexto}
        />
      ))}
    </div>
  )
}
