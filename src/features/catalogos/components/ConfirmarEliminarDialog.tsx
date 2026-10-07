import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'

interface Props {
  abierto: boolean
  titulo: string
  mensaje: string
  error?: string | null
  guardando: boolean
  onConfirmar: () => void
  onCerrar: () => void
}

export function ConfirmarEliminarDialog({
  abierto,
  titulo,
  mensaje,
  error,
  guardando,
  onConfirmar,
  onCerrar,
}: Props) {
  return (
    <Dialog abierto={abierto} titulo={titulo} onCerrar={onCerrar}>
      <div className="space-y-5">
        {error && <Alert>{error}</Alert>}

        <p className="text-lg leading-relaxed">{mensaje}</p>

        <p className="text-tinta-suave text-base">
          Esta acción no se puede deshacer. Si el registro está en uso por libros o personas existentes, el sistema impedirá su eliminación para proteger los datos.
        </p>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variante="secundario"
            onClick={onCerrar}
            disabled={guardando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variante="peligro"
            onClick={onConfirmar}
            disabled={guardando}
          >
            {guardando ? 'Eliminando…' : 'Sí, eliminar'}
          </Button>
        </div>
      </div>
    </Dialog>
  )
}
