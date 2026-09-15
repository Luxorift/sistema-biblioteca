import { ReactNode } from 'react'
import { Button } from './Button'
import { Modal } from './Modal'

type Props = { isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; children: ReactNode; variant?: 'normal' | 'danger'; isLoading?: boolean }

export function ConfirmModal({ isOpen, onClose, onConfirm, title, children, variant = 'normal', isLoading = false }: Props) {
  return <Modal isOpen={isOpen} onClose={onClose} title={title}><p className="text-slate-700 dark:text-slate-300">{children}</p><div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="secondary" className="dark:border-blue-300 dark:bg-slate-700 dark:text-blue-200" onClick={onClose} disabled={isLoading}>Cancelar</Button><Button type="button" variant={variant === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={isLoading}>{isLoading ? 'Guardando…' : 'Confirmar'}</Button></div></Modal>
}
