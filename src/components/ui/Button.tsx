import { ButtonHTMLAttributes, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
}

const variants = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  danger: 'inline-flex min-h-touch items-center justify-center rounded-lg bg-danger px-6 py-3 font-bold text-white shadow-sm hover:bg-red-800',
}

export function Button({ children, variant = 'primary', className = '', ...props }: Props) {
  return <button className={`${variants[variant]} ${className}`} {...props}>{children}</button>
}
