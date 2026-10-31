import {
  camposExcel,
  type ArchivoInventario,
  type CampoCatalogo,
  type ConfiguracionHoja,
  type ContextoImportacion,
  type DecisionDuplicado,
  type DecisionEquivalencia,
  type DecisionExistente,
  type EquivalenciaAplicada,
  type FilaImportable,
  type FilaInventario,
  type GrupoEquivalencias,
} from './types'
import {
  claveMaterial,
  interpretarUbicacion,
  nombreUbicacion,
  normalizarTexto,
  valoresFila,
} from './normalizacion'

export function extraerFilas(
  archivo: ArchivoInventario,
  configuracion: Record<string, ConfiguracionHoja>,
  tipoGeneral: string,
  separarAutores: boolean,
): FilaInventario[] {
  return archivo.hojas.flatMap((hoja) => {
    const ajuste = configuracion[hoja.nombre]
    if (!ajuste?.incluir) return []
    return hoja.filas.flatMap((fila) => {
      const originales = Object.fromEntries(
        camposExcel.map((campo) => [
          campo,
          String(fila.celdas[ajuste.mapeo[campo]] ?? '').trim(),
        ]),
      ) as FilaInventario['originales']
      if (!originales.titulo) return []
      return [
        {
          id: JSON.stringify([hoja.nombre, fila.numero]),
          hoja: hoja.nombre,
          fila: fila.numero,
          titulo: originales.titulo,
          autores: (separarAutores
            ? originales.autor.split(/[/;\n]+/)
            : [originales.autor]
          )
            .map((a) => a.trim())
            .filter((a) => normalizarTexto(a)),
          editorial: originales.editorial,
          cantidad: originales.cantidad,
          anio: originales.anio,
          ubicacion: originales.ubicacion,
          tipo: originales.tipo || ajuste.tipo || tipoGeneral.trim(),
          categoria: originales.categoria || ajuste.categoria.trim(),
          originales,
          omitir: false,
        },
      ]
    })
  })
}

export function resolverEquivalencias(
  filas: FilaInventario[],
  grupos: GrupoEquivalencias[],
  decisiones: Record<string, DecisionEquivalencia>,
  contexto: ContextoImportacion,
): { filas: FilaInventario[]; equivalencias: EquivalenciaAplicada[] } {
  const cambios = new Map<string, string>()
  const equivalencias = new Map<string, EquivalenciaAplicada>()
  for (const grupo of grupos) {
    const decision = decisiones[grupo.id]
    if (decision)
      for (const origen of grupo.valores)
        cambios.set(
          JSON.stringify([grupo.campo, origen]),
          decision.separar ? origen : decision.destino.trim(),
        )
  }
  const resolver = (campo: CampoCatalogo, origen: string): string => {
    if (!origen) return ''
    const recordada = contexto.equivalencias.find(
      (e) => e.campo === campo && e.origen_clave === normalizarTexto(origen),
    )
    let destino =
      cambios.get(JSON.stringify([campo, origen])) ?? recordada?.destino ?? origen
    if (campo === 'ubicacion') {
      const ubicacion = interpretarUbicacion(destino)
      if (ubicacion) destino = nombreUbicacion(ubicacion.estante, ubicacion.nivel)
    }
    destino =
      contexto.catalogos[campo].find(
        (c) => normalizarTexto(c.nombre) === normalizarTexto(destino),
      )?.nombre ?? destino
    equivalencias.set(JSON.stringify([campo, normalizarTexto(origen)]), {
      campo,
      origen,
      destino,
    })
    return destino
  }
  const resueltas = filas.map((fila) => ({
    ...fila,
    autores: [...new Set(fila.autores.map((a) => resolver('autor', a)))],
    editorial: resolver('editorial', fila.editorial),
    tipo: resolver('tipo', fila.tipo),
    categoria: resolver('categoria', fila.categoria),
    ubicacion: resolver('ubicacion', fila.ubicacion),
  }))
  return { filas: resueltas, equivalencias: [...equivalencias.values()] }
}

export function erroresFila(fila: FilaInventario): string[] {
  if (fila.omitir) return []
  const errores: string[] = []
  if (!fila.titulo.trim() || fila.titulo.length > 300)
    errores.push('Título requerido, hasta 300 caracteres')
  if (!fila.tipo.trim() || fila.tipo.length > 200)
    errores.push('Elige un tipo de material')
  if (
    fila.categoria.length > 200 ||
    fila.editorial.length > 200 ||
    fila.autores.some((a) => a.length > 200)
  )
    errores.push('Acorta los nombres a 200 caracteres')
  if (
    !/^\d+$/.test(fila.cantidad) ||
    Number(fila.cantidad) < 1 ||
    Number(fila.cantidad) > 500
  )
    errores.push('Cantidad entera de 1 a 500')
  if (
    fila.anio &&
    (!/^\d{4}$/.test(fila.anio) || Number(fila.anio) < 1400 || Number(fila.anio) > 2100)
  )
    errores.push('Indica un solo año válido o déjalo vacío si se desconoce')
  if (!interpretarUbicacion(fila.ubicacion))
    errores.push('Ubicación requerida: Estante A: Nivel 1')
  return errores
}

export function agruparMateriales(
  filas: FilaInventario[],
): Map<string, FilaInventario[]> {
  const grupos = new Map<string, FilaInventario[]>()
  for (const fila of filas.filter((f) => !f.omitir)) {
    const clave = claveMaterial(fila.titulo, fila.editorial, fila.anio)
    grupos.set(clave, [...(grupos.get(clave) ?? []), fila])
  }
  return grupos
}

export function prepararCarga(
  filas: FilaInventario[],
  contexto: ContextoImportacion,
  duplicados: Record<string, DecisionDuplicado>,
  existentes: Record<string, DecisionExistente>,
): { filas: FilaImportable[]; pendientes: string[]; materialesNuevos: number } {
  const pendientes: string[] = []
  const listas: FilaImportable[] = []
  let materialesNuevos = 0
  const porClave = new Map(
    contexto.materiales.map((m) => [claveMaterial(m.titulo, m.editorial, m.anio), m]),
  )
  for (const [clave, grupo] of agruparMateriales(filas)) {
    const existente = porClave.get(clave)
    if (existente && !existentes[clave])
      pendientes.push(`Revisa el material ya registrado: ${grupo[0].titulo}`)
    if (existentes[clave] === 'omitir') continue
    if (grupo.length > 1 && !duplicados[clave])
      pendientes.push(`Revisa las filas repetidas: ${grupo[0].titulo}`)
    const elegidas = duplicados[clave] === 'primera' ? grupo.slice(0, 1) : grupo
    // No permitir que la primera fila oculte discrepancias en una misma ficha.
    const metadatos = new Set(
      elegidas.map((f) =>
        JSON.stringify([
          normalizarTexto(f.tipo),
          normalizarTexto(f.categoria),
          f.autores.map(normalizarTexto).sort(),
        ]),
      ),
    )
    if (!existente && metadatos.size > 1)
      pendientes.push(
        `Unifica tipo, categoría y autores de las filas de: ${grupo[0].titulo}`,
      )
    if (!existente) materialesNuevos++
    for (const fila of elegidas) {
      if (erroresFila(fila).length) {
        pendientes.push(
          `${fila.hoja}, fila ${fila.fila}: ${erroresFila(fila).join('. ')}`,
        )
        continue
      }
      const ubicacion = interpretarUbicacion(fila.ubicacion)!
      listas.push({
        hoja: fila.hoja,
        fila: fila.fila,
        titulo: fila.titulo.trim(),
        autores: fila.autores,
        editorial: fila.editorial || null,
        cantidad: Number(fila.cantidad),
        anio: fila.anio ? Number(fila.anio) : null,
        ...ubicacion,
        tipo: fila.tipo.trim(),
        categoria: fila.categoria || null,
        material_existente_id: existente?.id ?? null,
        originales: fila.originales,
      })
    }
  }
  if (!listas.length) pendientes.push('Selecciona al menos una fila para importar')
  if (listas.reduce((n, f) => n + f.cantidad, 0) > 50000)
    pendientes.push('Importa hasta 50.000 copias por operación')
  return { filas: listas, pendientes, materialesNuevos }
}

// Solo se recuerdan equivalencias cuyo destino sigue presente tras la revisión manual.
export function equivalenciasVigentes(
  equivalencias: EquivalenciaAplicada[],
  filas: FilaInventario[],
): EquivalenciaAplicada[] {
  return equivalencias.filter((e) =>
    filas.some(
      (f) =>
        !f.omitir &&
        valoresFila(f, e.campo).some(
          (v) => normalizarTexto(v) === normalizarTexto(e.destino),
        ),
    ),
  )
}
