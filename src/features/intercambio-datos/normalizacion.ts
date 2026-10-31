import type {
  CampoCatalogo,
  ContextoImportacion,
  FilaInventario,
  GrupoEquivalencias,
} from './types'

export function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function interpretarUbicacion(
  texto: string,
): { estante: string; nivel: number } | null {
  const coincidencia = normalizarTexto(texto).match(/^estante ([a-z]) nivel (\d+)$/)
  if (!coincidencia) return null
  const nivel = Number(coincidencia[2])
  return nivel > 0 && nivel <= 32767
    ? { estante: coincidencia[1].toUpperCase(), nivel }
    : null
}
export function nombreUbicacion(estante: string, nivel: number): string {
  return `Estante ${estante.toUpperCase()}: Nivel ${nivel}`
}
export function claveMaterial(
  titulo: string,
  editorial: string | null,
  anio: string | number | null,
): string {
  return JSON.stringify([
    normalizarTexto(titulo),
    normalizarTexto(editorial ?? ''),
    String(anio ?? '').trim(),
  ])
}

// Las cifras deben coincidir: SOL 90 y SOL 91, o distintos tomos, no son variantes.
export function similitud(a: string, b: string): number {
  const x = normalizarTexto(a),
    y = normalizarTexto(b)
  if (JSON.stringify(x.match(/\d+/g)) !== JSON.stringify(y.match(/\d+/g))) return 0
  if (x === y) return 1
  const sinSociedad = (v: string) => v.replace(/ (s a c|s a|s r l|e i r l)$/, '').trim()
  if (sinSociedad(x) === sinSociedad(y)) return 0.95
  if (Math.min(x.length, y.length) < 5) return 0
  let anterior = Array.from({ length: y.length + 1 }, (_, i) => i)
  for (let i = 1; i <= x.length; i++) {
    const actual = [i]
    for (let j = 1; j <= y.length; j++)
      actual[j] = Math.min(
        actual[j - 1] + 1,
        anterior[j] + 1,
        anterior[j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1),
      )
    anterior = actual
  }
  return 1 - anterior[y.length] / Math.max(x.length, y.length)
}

export function valoresFila(fila: FilaInventario, campo: CampoCatalogo): string[] {
  return campo === 'autor' ? fila.autores : [fila[campo]]
}

export function crearGruposEquivalencias(
  filas: FilaInventario[],
  contexto: ContextoImportacion,
): GrupoEquivalencias[] {
  const grupos: GrupoEquivalencias[] = []
  for (const campo of ['autor', 'editorial', 'tipo', 'categoria', 'ubicacion'] as const) {
    const conteos = new Map<string, number>()
    for (const fila of filas)
      for (const valor of valoresFila(fila, campo))
        if (valor.trim()) conteos.set(valor, (conteos.get(valor) ?? 0) + 1)
    const pendientes = new Set(conteos.keys())
    for (const valor of conteos.keys()) {
      if (!pendientes.has(valor)) continue
      const valores = [...pendientes].filter(
        (otro) =>
          normalizarTexto(valor) === normalizarTexto(otro) ||
          (campo !== 'ubicacion' && similitud(valor, otro) >= 0.88),
      )
      valores.forEach((v) => pendientes.delete(v))
      const existente = contexto.catalogos[campo].find(
        (c) => normalizarTexto(c.nombre) === normalizarTexto(valor),
      )
      const similarExistente =
        campo !== 'ubicacion' &&
        !existente &&
        contexto.catalogos[campo].find((c) => similitud(c.nombre, valor) >= 0.88)
      const ubicacion = campo === 'ubicacion' ? interpretarUbicacion(valor) : null
      const sugerenciaUbicacion =
        campo === 'ubicacion'
          ? interpretarUbicacion(valor.replace(/^etante/i, 'Estante'))
          : null
      const recordada = contexto.equivalencias.find(
        (e) => e.campo === campo && e.origen_clave === normalizarTexto(valor),
      )
      if (
        valores.length < 2 &&
        !similarExistente &&
        !(campo === 'ubicacion' && !ubicacion && sugerenciaUbicacion)
      )
        continue
      grupos.push({
        id: `${campo}:${JSON.stringify(valores.slice().sort())}`,
        campo,
        valores,
        cantidades: valores.map((v) => conteos.get(v)!),
        sugerido:
          recordada?.destino ??
          existente?.nombre ??
          (similarExistente
            ? similarExistente.nombre
            : sugerenciaUbicacion
              ? nombreUbicacion(sugerenciaUbicacion.estante, sugerenciaUbicacion.nivel)
              : valores.slice().sort((a, b) => conteos.get(b)! - conteos.get(a)!)[0]),
      })
    }
  }
  return grupos
}
