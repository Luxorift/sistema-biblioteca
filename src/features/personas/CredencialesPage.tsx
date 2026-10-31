import { useRef, useState } from 'react'
import { irAlPaso } from '@/lib/guiarNavegacion'
import { Link, useSearchParams } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { CredencialImprimible } from './components/CredencialImprimible'
import type { Persona } from './types'
import { usePersonas } from './usePersonas'

export function CredencialesPage() {
  const vistaPreviaRef = useRef<HTMLElement>(null)
  const listaRef = useRef<HTMLElement>(null)
  const [parametros] = useSearchParams()
  const codigoInicial = parametros.get('codigo') ?? ''
  const [buscar, setBuscar] = useState(codigoInicial)
  const [pagina, setPagina] = useState(0)
  const personas = usePersonas({ buscar, tipo: '', estado: '', correo: '', pagina })
  // Guardamos las personas elegidas para conservar la selección entre páginas.
  const [seleccion, setSeleccion] = useState<Map<number, Persona> | null>(null)
  const filas = personas.data?.personas ?? []
  const seleccionadas =
    seleccion ??
    new Map(
      filas
        .filter((persona) => persona.codigo === codigoInicial)
        .map((persona) => [persona.id, persona]),
    )
  const total = personas.data?.total ?? 0

  const alternar = (persona: Persona) => {
    const nuevas = new Map(seleccionadas)
    if (nuevas.has(persona.id)) nuevas.delete(persona.id)
    else nuevas.set(persona.id, persona)
    setSeleccion(nuevas)
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3 print:hidden">
        <h1 className="text-3xl font-bold">Credenciales de biblioteca</h1>
        <p className="text-tinta-suave text-xl">
          Selecciona personas para imprimir sus credenciales con código de barras.
        </p>
        <Link to="/personas" className="text-primario font-bold underline">
          Volver a personas
        </Link>
      </header>
      <section
        ref={listaRef}
        tabIndex={-1}
        className="destino-flujo space-y-4 print:hidden"
        aria-label="Selección de personas para credenciales"
      >
        <h2 className="text-2xl font-bold">1. Selecciona las personas</h2>
        <p role="status">
          {seleccionadas.size} credenciales seleccionadas. Puedes seguir eligiendo en
          otras páginas y después revisar la vista previa.
        </p>
        <TextField
          label="Buscar por nombre, DNI o código"
          value={buscar}
          onChange={(evento) => {
            setSeleccion(new Map(seleccionadas))
            setPagina(0)
            setBuscar(evento.target.value)
          }}
        />
        {personas.isLoading && <p role="status">Cargando personas…</p>}
        {personas.isError && (
          <Alert>
            No se pudieron cargar las personas. Revisa la conexión e intenta nuevamente.
          </Alert>
        )}
        {personas.isSuccess && (
          <>
            <Button
              variante="secundario"
              onClick={() => {
                const nuevas = new Map(seleccionadas)
                filas.forEach((persona) => nuevas.set(persona.id, persona))
                setSeleccion(nuevas)
              }}
              disabled={filas.length === 0}
            >
              Seleccionar esta página
            </Button>
            <ul className="border-borde divide-borde divide-y-2 rounded-xl border-2 bg-white">
              {filas.map((persona) => (
                <li key={persona.id}>
                  <label className="flex min-h-12 cursor-pointer items-center gap-3 p-4">
                    <input
                      type="checkbox"
                      checked={seleccionadas.has(persona.id)}
                      onChange={() => alternar(persona)}
                      className="h-5 w-5"
                      aria-label={`Seleccionar ${persona.codigo}`}
                    />
                    <span>
                      {persona.codigo} · {persona.nombres} {persona.apellidoPaterno}{' '}
                      {persona.apellidoMaterno ?? ''} · {persona.tipoPersona}
                      {!persona.activo && ' · Inactiva'}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            {filas.length === 0 && <p>No se encontraron personas con ese dato.</p>}
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variante="secundario"
                disabled={pagina === 0}
                onClick={() => {
                  setPagina(pagina - 1)
                  irAlPaso(listaRef)
                }}
              >
                Anterior
              </Button>
              <p>
                Página {pagina + 1} de {Math.max(1, Math.ceil(total / 25))}
              </p>
              <Button
                variante="secundario"
                disabled={(pagina + 1) * 25 >= total}
                onClick={() => {
                  setPagina(pagina + 1)
                  irAlPaso(listaRef)
                }}
              >
                Siguiente
              </Button>
            </div>
          </>
        )}
      </section>
      <div className="flex flex-wrap items-center gap-4 print:hidden">
        <Button
          variante="secundario"
          disabled={seleccionadas.size === 0}
          onClick={() => irAlPaso(vistaPreviaRef)}
        >
          Ver vista previa
        </Button>
        <Button disabled={seleccionadas.size === 0} onClick={() => window.print()}>
          Imprimir credenciales ({seleccionadas.size})
        </Button>
        <Button
          variante="secundario"
          disabled={seleccionadas.size === 0}
          onClick={() => setSeleccion(new Map())}
        >
          Limpiar selección
        </Button>
        <p>Imprime al 100 % de escala. Cada credencial mide 85,6 mm de ancho.</p>
      </div>
      <section
        ref={vistaPreviaRef}
        tabIndex={-1}
        className="destino-flujo credenciales-hoja"
        aria-label="Vista previa de credenciales"
      >
        <h2 className="col-span-full text-2xl font-bold print:hidden">
          2. Revisa e imprime las credenciales
        </h2>
        {[...seleccionadas.values()].map((persona) => (
          <CredencialImprimible key={persona.id} persona={persona} />
        ))}
      </section>
    </div>
  )
}
