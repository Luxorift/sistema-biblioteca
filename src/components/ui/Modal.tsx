import { ReactNode, useEffect } from 'react'

type Props = { isOpen: boolean; onClose: () => void; title: string; children: ReactNode }

export function Modal({ isOpen, onClose, title, children }: Props) {
  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" role="presentation" onMouseDown={onClose}>
    <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-start justify-between gap-4"><h2 id="modal-title" className="m-0 text-2xl font-bold text-slate-900 dark:text-white">{title}</h2><button type="button" className="min-h-touch min-w-touch rounded-lg text-2xl font-bold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700" onClick={onClose} aria-label="Cerrar ventana">×</button></div>
      <div className="mt-5">{children}</div>
    </section>
  </div>
}
