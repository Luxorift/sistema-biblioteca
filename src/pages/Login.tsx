import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Login() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const perfil = await signIn(email.trim(), password)
      navigate(perfil.rol === 'Administrador' ? '/admin' : '/dashboard', { replace: true })
    } catch {
      setError('No pudimos iniciar sesión. Revise su correo y contraseña e inténtelo nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-5 py-8">
      <section className="card w-full" aria-labelledby="login-title">
        <p className="m-0 font-bold text-brand-blue">Sistema de Biblioteca</p>
        <h1 id="login-title" className="mt-2 text-3xl font-extrabold">Iniciar sesión</h1>
        <p className="text-slate-700">Ingrese sus datos para continuar.</p>
        {error && <div className="rounded-lg border-2 border-danger bg-red-50 p-4 font-semibold text-danger" role="alert">{error}</div>}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-2 block font-bold" htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-touch w-full rounded-lg border-2 border-slate-700 px-4 py-3" />
          </div>
          <div>
            <label className="mb-2 block font-bold" htmlFor="password">Contraseña</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-touch w-full rounded-lg border-2 border-slate-700 px-4 py-3" />
          </div>
          <button className="button-primary w-full text-xl" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando…' : 'Ingresar al sistema'}
          </button>
        </form>
        <Link className="mt-6 inline-block min-h-touch font-bold text-brand-blue underline" to="/recuperar-contrasena">Olvidé mi contraseña</Link>
      </section>
    </main>
  )
}
