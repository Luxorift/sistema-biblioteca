import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

interface DialogProps {
  abierto: boolean
  titulo: string
  onCerrar: () => void
  children: ReactNode
}

export function Dialog({ abierto, titulo, onCerrar, children }: DialogProps) {
  const tituloId = useId()
  const dialogo = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const elemento = dialogo.current
    if (!elemento) return
    if (abierto && !elemento.open) elemento.showModal()
    if (!abierto && elemento.open) elemento.close()
  }, [abierto])
  if (!abierto) return null
  return (
    <dialog
      ref={dialogo}
      aria-labelledby={tituloId}
      onCancel={(evento) => {
        evento.preventDefault()
        onCerrar()
      }}
      className="border-borde bg-papel text-tinta backdrop:bg-tinta/50 m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border-2 p-0"
    >
      <div className="border-borde flex items-center justify-between border-b-2 p-5">
        <h2 id={tituloId} className="text-2xl font-bold">
          {titulo}
        </h2>
        <Button variante="secundario" onClick={onCerrar} aria-label="Cerrar ventana">
          <X aria-hidden size={22} /> Cerrar
        </Button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  )
}
