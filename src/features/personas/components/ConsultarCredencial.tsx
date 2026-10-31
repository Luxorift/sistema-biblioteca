import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import type { PersonaCredencial } from '../types'
import { useConsultarCredencial } from '../usePersonas'

interface ConsultarCredencialProps {
  onPrestar: (persona: PersonaCredencial) => void
}

export function ConsultarCredencial({ onPrestar }: ConsultarCredencialProps) {
  const [entrada, setEntrada] = useState('')
  const [codigo, setCodigo] = useState('')
  const [errorEntrada, setErrorEntrada] = useState('')
  const consulta = useConsultarCredencial(codigo)
  const resultado = consulta.data

  const buscar = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const normalizado = entrada.trim().toUpperCase()
    if (!/^PER-\d{6,}$/.test(normalizado)) {
      setErrorEntrada(
        'Escanea una credencial de persona o escribe su código, por ejemplo PER-000001.',
      )
      setCodigo('')
      return
    }
    setErrorEntrada('')
    if (normalizado === codigo) void consulta.refetch()
    else setCodigo(normalizado)
  }

  return (
    <section
      className="border-borde space-y-4 rounded-2xl border-2 bg-white p-5"
      aria-label="Atención por credencial"
    >
      <h2 className="text-2xl font-bold">Escanear credencial</h2>
      <p className="text-tinta-suave">
        Coloca el cursor en el campo y escanea. También puedes escribir el código y pulsar
        Enter.
      </p>
      <form onSubmit={buscar} className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <TextField
            label="Código de credencial"
            value={entrada}
            onChange={(evento) => setEntrada(evento.target.value)}
            placeholder="PER-000001"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            error={errorEntrada || undefined}
          />
        </div>
        <Button type="submit" disabled={consulta.isFetching}>
          Consultar credencial
        </Button>
        {codigo && (
          <Button
            variante="secundario"
            onClick={() => {
              setCodigo('')
              setEntrada('')
              setErrorEntrada('')
            }}
          >
            Limpiar consulta
          </Button>
        )}
      </form>
      {codigo && consulta.isFetching && <p role="status">Consultando credencial…</p>}
      {codigo && consulta.isError && (
        <Alert>
          No se pudo consultar la credencial. Revisa la conexión e intenta de nuevo.
        </Alert>
      )}
      {codigo && !consulta.isFetching && consulta.isSuccess && !resultado && (
        <Alert>No existe una persona con ese código. Revisa la credencial.</Alert>
      )}
      {codigo && resultado && !consulta.isError && (
        <div className="space-y-4" aria-live="polite">
          <div>
            <h3 className="text-xl font-bold">
              {resultado.persona.nombres} {resultado.persona.apellidoPaterno}{' '}
              {resultado.persona.apellidoMaterno ?? ''}
            </h3>
            <p>
              {resultado.persona.codigo} · {resultado.persona.tipoPersona} ·{' '}
              {resultado.persona.activo ? 'Persona activa' : 'Persona inactiva'}
            </p>
          </div>
          {!resultado.persona.activo && (
            <Alert>
              Esta persona está inactiva. Puedes revisar sus préstamos y registrar
              devoluciones, pero no prestarle nuevos materiales.
            </Alert>
          )}
          <p className="text-lg font-bold">
            Préstamos pendientes: {resultado.pendientes}. Atrasados: {resultado.atrasados}
            .
          </p>
          {resultado.atrasados > 0 && (
            <Alert>
              Hay préstamos atrasados. El mayor atraso es de {resultado.maxDiasAtraso}{' '}
              días.
            </Alert>
          )}
          <Button
            disabled={!resultado.persona.activo}
            onClick={() => onPrestar(resultado.persona)}
          >
            Prestar a esta persona
          </Button>
          {resultado.prestamos.length > 0 ? (
            <ul className="space-y-3" aria-label="Préstamos de la credencial">
              {resultado.prestamos.map((prestamo) => (
                <li
                  key={prestamo.id}
                  className="border-borde flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 p-4"
                >
                  <div>
                    <p className="font-bold">
                      {prestamo.titulo} · {prestamo.codigo}
                    </p>
                    <p>
                      Límite: {prestamo.fechaLimite ?? 'Sin fecha límite'}.{' '}
                      {prestamo.estaAtrasado
                        ? `Atrasado ${prestamo.diasAtraso} días.`
                        : 'Sin atraso.'}
                    </p>
                  </div>
                  <Link
                    className="text-primario min-h-12 content-center font-bold underline"
                    to={`/prestamos?tab=devolver&prestamoId=${prestamo.id}`}
                  >
                    Devolver {prestamo.codigo}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>No tiene libros pendientes de devolución.</p>
          )}
        </div>
      )}
    </section>
  )
}
