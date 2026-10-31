import { Select } from '@/components/ui/Select'
import { agruparMateriales } from '../prepararImportacion'
import { claveMaterial } from '../normalizacion'
import type {
  ContextoImportacion,
  DecisionDuplicado,
  DecisionExistente,
  FilaInventario,
} from '../types'

interface Props {
  filas: FilaInventario[]
  contexto: ContextoImportacion
  duplicados: Record<string, DecisionDuplicado>
  onDuplicado: (clave: string, valor: DecisionDuplicado | undefined) => void
  existentes: Record<string, DecisionExistente>
  onExistente: (clave: string, valor: DecisionExistente | undefined) => void
  onTodosExistentes: (valor: DecisionExistente) => void
}
export function RevisionCoincidencias({
  filas,
  contexto,
  duplicados,
  onDuplicado,
  existentes,
  onExistente,
  onTodosExistentes,
}: Props) {
  const grupos = [...agruparMateriales(filas)]
  const repetidos = grupos.filter(([, grupo]) => grupo.length > 1)
  const porClave = new Map(
    contexto.materiales.map((m) => [claveMaterial(m.titulo, m.editorial, m.anio), m]),
  )
  const registrados = grupos.filter(([clave]) => porClave.has(clave))
  return (
    <section className="space-y-4" aria-label="Revisión de duplicados y existentes">
      <h3 className="text-xl font-bold">Filas repetidas y materiales ya registrados</h3>
      <p>
        {repetidos.length} grupos de filas repetidas en el archivo. {registrados.length}{' '}
        materiales coinciden con el inventario actual.
      </p>
      {repetidos.map(([clave, grupo]) => (
        <article
          key={clave}
          className="border-borde space-y-3 rounded-xl border-2 bg-white p-4"
        >
          <h4 className="font-bold">{grupo[0].titulo}</h4>
          <ul>
            {grupo.map((f) => (
              <li key={f.id}>
                {f.hoja}, fila {f.fila}: {f.cantidad} copias · {f.ubicacion}
              </li>
            ))}
          </ul>
          <Select
            label={`Decisión para filas repetidas de ${grupo[0].titulo}`}
            value={duplicados[clave] ?? ''}
            onChange={(e) =>
              onDuplicado(
                clave,
                (e.target.value || undefined) as DecisionDuplicado | undefined,
              )
            }
          >
            <option value="">Revisar antes de importar</option>
            <option value="sumar">
              Son copias adicionales: sumar cantidades y conservar ubicaciones
            </option>
            <option value="primera">Es una fila repetida: usar solo la primera</option>
          </Select>
        </article>
      ))}
      {registrados.length > 0 && (
        <Select
          label="Aplicar una decisión a todos los materiales ya registrados"
          value=""
          onChange={(e) => {
            if (e.target.value) onTodosExistentes(e.target.value as DecisionExistente)
          }}
        >
          <option value="">Elegir uno por uno o aplicar a todos</option>
          <option value="agregar">
            Añadir las copias a todos los materiales coincidentes
          </option>
          <option value="omitir">Omitir todos los materiales coincidentes</option>
        </Select>
      )}
      {registrados.map(([clave, grupo]) => (
        <article
          key={clave}
          className="border-borde space-y-3 rounded-xl border-2 bg-white p-4"
        >
          <h4 className="font-bold">Ya existe: {grupo[0].titulo}</h4>
          <p>
            {porClave.get(clave)!.editorial ?? 'Sin editorial'} ·{' '}
            {porClave.get(clave)!.anio ?? 'Sin año'} · {porClave.get(clave)!.tipo}
          </p>
          <p>
            Se conservará la ficha existente. Solo se añadirán las copias que confirmes.
          </p>
          <Select
            label={`Decisión para material existente ${grupo[0].titulo}`}
            value={existentes[clave] ?? ''}
            onChange={(e) =>
              onExistente(
                clave,
                (e.target.value || undefined) as DecisionExistente | undefined,
              )
            }
          >
            <option value="">Revisar antes de importar</option>
            <option value="agregar">Añadir las copias del Excel</option>
            <option value="omitir">Omitir estas filas</option>
          </Select>
        </article>
      ))}
    </section>
  )
}
