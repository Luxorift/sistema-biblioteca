import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import type { Persona } from '../types'

interface TablaPersonasProps {
  personas: Persona[]
  onEditar: (persona: Persona) => void
}

export function TablaPersonas({ personas, onEditar }: TablaPersonasProps) {
  return (
    <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
      <table className="w-full min-w-225 border-collapse text-left">
        <thead className="bg-papel">
          <tr>
            <th className="p-4">Persona</th>
            <th className="p-4">Credencial</th>
            <th className="p-4">DNI</th>
            <th className="p-4">Tipo</th>
            <th className="p-4">Correo</th>
            <th className="p-4">Estado</th>
            <th className="p-4">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {personas.map((persona) => (
            <tr key={persona.id} className="border-borde border-t-2">
              <td className="p-4 font-bold">
                {persona.apellidoPaterno} {persona.apellidoMaterno ?? ''},{' '}
                {persona.nombres}
              </td>
              <td className="p-4 font-mono">{persona.codigo}</td>
              <td className="p-4">{persona.dni}</td>
              <td className="p-4">{persona.tipoPersona}</td>
              <td className="p-4">{persona.correo ?? '—'}</td>
              <td className="p-4">{persona.activo ? 'Activo' : 'Inactivo'}</td>
              <td className="p-4">
                <Button variante="secundario" onClick={() => onEditar(persona)}>
                  Editar datos
                </Button>
                <Link
                  to={`/credenciales?codigo=${persona.codigo}`}
                  className="text-primario mt-3 block min-h-12 content-center font-bold underline"
                >
                  Ver credencial
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
