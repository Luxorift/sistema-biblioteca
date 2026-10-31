import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { Select } from '@/components/ui/Select'
import { erroresFila } from '../prepararImportacion'
import type { FilaInventario } from '../types'

export function RevisionFilas({
  filas,
  onCorregir,
}: {
  filas: FilaInventario[]
  onCorregir: (id: string, cambios: Partial<FilaInventario>) => void
}) {
  const [soloPendientes, setSoloPendientes] = useState(true)
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(0)
  const filtradas = filas.filter(
    (f) =>
      (!soloPendientes || erroresFila(f).length > 0) &&
      `${f.hoja} ${f.fila} ${f.titulo}`
        .toLocaleLowerCase()
        .includes(buscar.toLocaleLowerCase()),
  )
  const paginaVisible = Math.min(
    pagina,
    Math.max(0, Math.ceil(filtradas.length / 20) - 1),
  )
  return (
    <section className="space-y-4" aria-label="Corrección de filas">
      <h3 className="text-xl font-bold">Completa o corrige las filas</h3>
      <p>
        Los títulos, tomos, grados y años se conservan. Un año desconocido puede quedar
        vacío; una ubicación sí es obligatoria para crear las copias.
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        <Select
          label="Mostrar filas"
          value={soloPendientes ? 'pendientes' : 'todas'}
          onChange={(e) => {
            setSoloPendientes(e.target.value === 'pendientes')
            setPagina(0)
          }}
        >
          <option value="pendientes">Solo filas con datos pendientes</option>
          <option value="todas">Todas las filas, incluidas las omitidas</option>
        </Select>
        <TextField
          label="Buscar título, hoja o fila"
          value={buscar}
          onChange={(e) => {
            setBuscar(e.target.value)
            setPagina(0)
          }}
        />
      </div>
      <p role="status">{filtradas.length} filas en esta vista.</p>
      {filtradas.slice(paginaVisible * 20, (paginaVisible + 1) * 20).map((fila) => {
        const errores = erroresFila(fila)
        return (
          <details
            key={fila.id}
            className="border-borde rounded-xl border-2 bg-white p-4"
          >
            <summary className="min-h-12 cursor-pointer font-bold">
              {fila.hoja}, fila {fila.fila}: {fila.titulo} ·{' '}
              {fila.omitir
                ? 'Omitida'
                : errores.length
                  ? `${errores.length} datos por revisar`
                  : 'Lista'}
            </summary>
            <div className="space-y-3 pt-3">
              {errores.length > 0 && (
                <ul className="text-peligro list-inside list-disc font-bold">
                  {errores.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              <label className="flex min-h-12 items-center gap-3">
                <input
                  type="checkbox"
                  checked={fila.omitir}
                  onChange={(e) => onCorregir(fila.id, { omitir: e.target.checked })}
                />
                Omitir esta fila en esta importación
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                {(
                  [
                    'titulo',
                    'tipo',
                    'categoria',
                    'editorial',
                    'cantidad',
                    'anio',
                    'ubicacion',
                  ] as const
                ).map((campo) => (
                  <TextField
                    key={campo}
                    label={`${campo} (${fila.hoja}, fila ${fila.fila})`}
                    value={fila[campo]}
                    onChange={(e) => onCorregir(fila.id, { [campo]: e.target.value })}
                  />
                ))}
                <TextField
                  label={`Autores separados por / (${fila.hoja}, fila ${fila.fila})`}
                  value={fila.autores.join(' / ')}
                  onChange={(e) =>
                    onCorregir(fila.id, {
                      autores: e.target.value
                        .split(/[/;\n]+/)
                        .map((a) => a.trim())
                        .filter(Boolean),
                    })
                  }
                />
              </div>
              <details>
                <summary className="min-h-12 cursor-pointer font-bold">
                  Ver datos originales del Excel
                </summary>
                <dl>
                  {Object.entries(fila.originales).map(([campo, valor]) => (
                    <div key={campo}>
                      <dt className="font-bold">{campo}</dt>
                      <dd className="break-words">{valor || 'Vacío'}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </div>
          </details>
        )
      })}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variante="secundario"
          disabled={paginaVisible === 0}
          onClick={() => setPagina(paginaVisible - 1)}
        >
          Filas anteriores
        </Button>
        <p>
          Página {paginaVisible + 1} de {Math.max(1, Math.ceil(filtradas.length / 20))}
        </p>
        <Button
          variante="secundario"
          disabled={(paginaVisible + 1) * 20 >= filtradas.length}
          onClick={() => setPagina(paginaVisible + 1)}
        >
          Más filas
        </Button>
      </div>
    </section>
  )
}
