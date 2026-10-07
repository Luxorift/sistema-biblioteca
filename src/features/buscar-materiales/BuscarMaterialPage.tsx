import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { ResultadoMaterial } from './components/ResultadoMaterial'
import { useBuscarMateriales } from './useBuscarMateriales'
import { useDebouncedValue } from './useDebouncedValue'

export function BuscarMaterialPage() {
  const [termino, setTermino] = useState('')
  const terminoConDemora = useDebouncedValue(termino)
  const consulta = useBuscarMateriales(terminoConDemora)
  const buscando = terminoConDemora.trim().length >= 2
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Buscar material</h1>
          <p className="text-tinta-suave text-xl">
            Escribe un título o el nombre de un autor.
          </p>
        </div>
        <Link
          to="/"
          className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-5 text-lg font-bold"
        >
          Volver al inicio
        </Link>
      </div>
      <div className="max-w-2xl">
        <TextField
          label="Buscar por título o autor"
          value={termino}
          onChange={(evento) => setTermino(evento.target.value)}
          placeholder="Por ejemplo: Comunicación o MINEDU"
          autoFocus
        />
      </div>
      {!buscando && (
        <p className="text-tinta-suave">Escribe al menos 2 letras para buscar.</p>
      )}
      {consulta.isLoading && <p aria-live="polite">Buscando materiales…</p>}
      {consulta.isError && (
        <Alert>
          No se pudo realizar la búsqueda. Revisa tu conexión e intenta de nuevo.
        </Alert>
      )}
      {consulta.isSuccess && !consulta.data.length && (
        <section className="border-borde space-y-3 rounded-2xl border-2 bg-white p-5">
          <h2 className="text-2xl font-bold">No encontramos materiales</h2>
          <p>
            Prueba con otra palabra o registra el material si todavía no está en la
            biblioteca.
          </p>
          <Button>
            <Link to="/agregar">Agregar material</Link>
          </Button>
        </section>
      )}
      {consulta.data && consulta.data.length > 0 && (
        <section className="space-y-4" aria-live="polite">
          <p className="text-tinta-suave">
            {consulta.data.length}{' '}
            {consulta.data.length === 1
              ? 'material encontrado'
              : 'materiales encontrados'}
            .
          </p>
          {consulta.data.map((material) => (
            <ResultadoMaterial key={material.id} material={material} />
          ))}
        </section>
      )}
    </div>
  )
}
