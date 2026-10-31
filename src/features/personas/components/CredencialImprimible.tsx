import { CodigoBarras } from '@/components/ui/CodigoBarras'
import type { Persona } from '../types'

export function CredencialImprimible({ persona }: { persona: Persona }) {
  return (
    <article
      className="credencial-biblioteca"
      aria-label={`Credencial de ${persona.nombres} ${persona.apellidoPaterno}`}
    >
      <p className="text-sm font-bold tracking-wide uppercase">Biblioteca</p>
      <h2 className="text-base font-bold">Credencial de biblioteca</h2>
      <p className="my-2 text-lg leading-tight font-bold">
        {persona.nombres} {persona.apellidoPaterno} {persona.apellidoMaterno ?? ''}
      </p>
      <p className="text-sm">
        {persona.tipoPersona}
        {!persona.activo && ' · Inactiva'}
      </p>
      <div className="credencial-barras">
        <CodigoBarras codigo={persona.codigo} ancho={1.5} alto={40} />
      </div>
      <p className="text-center font-mono text-base font-bold">{persona.codigo}</p>
    </article>
  )
}
