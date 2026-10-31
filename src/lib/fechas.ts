// Las operaciones de la biblioteca usan días calendario de Perú, también al viajar.
const formato = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Lima',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function fechaBiblioteca(fecha: Date | string = new Date()): string {
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha
  const partes = formato.formatToParts(new Date(fecha))
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)!.value
  return `${parte('year')}-${parte('month')}-${parte('day')}`
}

export function diasEntreFechas(desde: string, hasta: string): number {
  return Math.round(
    (Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000,
  )
}

export function instantePrestamo(fecha: string): string {
  return `${fecha}T12:00:00-05:00`
}
