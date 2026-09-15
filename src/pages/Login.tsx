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
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-slate-50 to-slate-200 px-5 py-8">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10" aria-labelledby="login-title">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-3xl text-white shadow-md" aria-hidden="true">📚</div>
          <p className="mt-5 text-2xl font-extrabold text-slate-900">Sistema de Biblioteca</p>
          <h1 id="login-title" className="mt-2 text-3xl font-extrabold text-brand-blue">Iniciar sesión</h1>
          <p className="mt-3 text-slate-600">Ingrese sus datos para continuar.</p>
        </div>
        {error && <div className="mt-6 rounded-lg border-2 border-danger bg-red-50 p-4 font-semibold text-danger" role="alert">{error}</div>}
        <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="mb-2 block font-bold text-slate-800" htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-touch w-full rounded-lg border border-gray-300 p-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" />
          </div>
          <div>
            <label className="mb-2 block font-bold text-slate-800" htmlFor="password">Contraseña</label>
            <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-touch w-full rounded-lg border border-gray-300 p-3 text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2" />
          </div>
          <button className="min-h-touch w-full rounded-lg bg-blue-600 px-6 py-3 text-xl font-bold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando…' : 'Ingresar al sistema'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link className="inline-block min-h-touch font-bold text-blue-600 hover:underline" to="/recuperar-contrasena">Olvidé mi contraseña</Link>
        </div>
      </section>
    </main>
  )
}
