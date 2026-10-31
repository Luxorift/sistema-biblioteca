// Si todas comparten ubicación, conservarla al aumentar la cantidad.
// Cuando hay ubicaciones distintas, las copias adicionales requieren una elección.
export function completarUbicaciones(
  cantidad: number,
  ubicaciones: (number | null)[],
): (number | null)[] {
  const total = Number.isInteger(cantidad) ? Math.max(0, Math.min(500, cantidad)) : 0
  const compartida =
    ubicaciones.length > 0 && ubicaciones.every((id) => id === ubicaciones[0])
      ? ubicaciones[0]
      : null
  return Array.from({ length: total }, (_, indice) => ubicaciones[indice] ?? compartida)
}

export function exigirUbicaciones(
  cantidad: number,
  ubicaciones: (number | null)[],
): number[] {
  const completas = completarUbicaciones(cantidad, ubicaciones)
  if (completas.some((id) => id === null || !Number.isInteger(id) || id <= 0)) {
    throw new Error('Indica la ubicación de cada copia nueva.')
  }
  return completas as number[]
}
