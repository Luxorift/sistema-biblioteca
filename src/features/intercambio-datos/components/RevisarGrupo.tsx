import { useId, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { normalizarTexto } from '../normalizacion'
import type {
  ContextoImportacion,
  DecisionEquivalencia,
  GrupoEquivalencias,
} from '../types'

const nombres = {
  autor: 'Autores',
  editorial: 'Editoriales',
  tipo: 'Tipos de material',
  categoria: 'Categorías',
  ubicacion: 'Ubicaciones',
}
export function RevisarGrupo({
  grupo,
  decision,
  onDecidir,
  contexto,
}: {
  grupo: GrupoEquivalencias
  decision?: DecisionEquivalencia
  onDecidir: (valor: DecisionEquivalencia | null) => void
  contexto: ContextoImportacion
}) {
  const [nombre, setNombre] = useState(decision?.destino || grupo.sugerido)
  const lista = useId()
  return (
    <article className="border-borde space-y-3 rounded-xl border-2 bg-white p-4">
      <h3 className="text-xl font-bold">
        {nombres[grupo.campo]} · {decision ? 'Revisado' : 'Decisión pendiente'}
      </h3>
      <ul>
        {grupo.valores.map((valor, i) => (
          <li key={valor}>
            {valor} — {grupo.cantidades[i]} apariciones
          </li>
        ))}
      </ul>
      <TextField
        label="Nombre definitivo para este grupo"
        list={lista}
        value={nombre}
        maxLength={200}
        onChange={(e) => {
          setNombre(e.target.value)
          onDecidir(null)
        }}
      />
      <datalist id={lista}>
        {[
          ...new Set([
            ...grupo.valores,
            ...contexto.catalogos[grupo.campo].map((c) => c.nombre),
          ]),
        ].map((valor) => (
          <option key={valor} value={valor} />
        ))}
      </datalist>
      <div className="flex flex-wrap gap-3">
        <Button
          disabled={!normalizarTexto(nombre)}
          onClick={() => onDecidir({ separar: false, destino: nombre.trim() })}
        >
          Usar este nombre
        </Button>
        {new Set(grupo.valores.map(normalizarTexto)).size > 1 ||
        grupo.valores.length === 1 ? (
          <Button
            variante="secundario"
            onClick={() => onDecidir({ separar: true, destino: '' })}
          >
            Mantener sin unificar
          </Button>
        ) : null}
      </div>
      {decision && (
        <p role="status">
          {decision.separar
            ? 'Se mantendrán los nombres separados.'
            : `Todas estas variantes usarán: ${decision.destino}.`}
        </p>
      )}
    </article>
  )
}
