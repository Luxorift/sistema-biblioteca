import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { requestRecoveryCode, updatePasswordWithRecoveryCode, validateRecoveryCode } from '../services/supabase/recuperacion'

export function RecuperarPassword() {
  const [email, setEmail] = useState('')
  const [perfilId, setPerfilId] = useState('')
  const [codigo, setCodigo] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [step, setStep] = useState<1 | 2>(1)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isRequesting, setIsRequesting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsRequesting(true)
    try {
      const result = await requestRecoveryCode(email.trim())
      setPerfilId(result?.perfilId ?? '')
      setStep(2)
      setMessage('Enviamos un código de 6 dígitos a su correo. Vence en 10 minutos.')
    } catch {
      setError('No fue posible enviar el correo. Revise la dirección e inténtelo otra vez.')
    } finally {
      setIsRequesting(false)
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsLoading(true)
    try {
      const isValid = await validateRecoveryCode(perfilId.trim(), codigo.trim())
      if (!isValid) {
        setError('El código no es válido, ya fue usado o venció. Solicite uno nuevo.')
        return
      }
      await updatePasswordWithRecoveryCode(isValid, nuevaPassword)
      setMessage('La contraseña fue actualizada correctamente. Ya puede iniciar sesión.')
    } catch {
      setError('No pudimos validar el código o actualizar la contraseña. Inténtelo nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-8 sm:py-14">
      <Link className="inline-block min-h-touch font-bold text-brand-blue underline" to="/login">Volver a iniciar sesión</Link>
      <section className="card mt-5" aria-labelledby="recovery-title">
        <h1 id="recovery-title" className="m-0 text-3xl font-extrabold">Recuperar contraseña</h1>
        <p className="text-slate-700">Recupere el acceso en dos pasos claros y seguros.</p>
        {error && <div className="rounded-lg border-2 border-danger bg-red-50 p-4 font-semibold text-danger" role="alert">{error}</div>}
        {message && <div className="rounded-lg border-2 border-success bg-green-50 p-4 font-semibold text-success" role="status">{message}</div>}
        {step === 1 && <form className="mt-6 space-y-4" onSubmit={handleRequest}>
          <h2 className="m-0 text-2xl font-bold">Paso 1: recibir código</h2>
          <label className="block font-bold" htmlFor="email">Correo electrónico
            <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 min-h-touch w-full rounded-lg border-2 border-slate-700 px-4 py-3" aria-describedby="email-help" />
          </label>
          <p id="email-help" className="m-0 text-slate-700">Le enviaremos un código de un solo uso a esta dirección.</p>
          <button className="button-primary w-full" type="submit" disabled={isRequesting}>{isRequesting ? 'Enviando correo…' : 'Enviar código de recuperación'}</button>
        </form>}
        {step === 2 && <form className="mt-6 space-y-5" onSubmit={handleReset}>
          <h2 className="m-0 text-2xl font-bold">Paso 2: confirmar y crear contraseña</h2>
          <p className="m-0 text-slate-700">Escriba el código que recibió y su nueva contraseña.</p>
          <label className="block font-bold" htmlFor="codigo">Código de 6 dígitos
            <input id="codigo" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} className="mt-2 min-h-touch w-full rounded-lg border-2 border-slate-700 px-4 py-3 text-2xl tracking-[0.3em]" />
          </label>
          <label className="block font-bold" htmlFor="nueva-password">Nueva contraseña
            <input id="nueva-password" type="password" autoComplete="new-password" minLength={8} required value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} className="mt-2 min-h-touch w-full rounded-lg border-2 border-slate-700 px-4 py-3" aria-describedby="password-help" />
          </label>
          <p id="password-help" className="m-0 text-slate-700">Use al menos 8 caracteres.</p>
          <button className="button-primary w-full" type="submit" disabled={isLoading}>{isLoading ? 'Validando…' : 'Validar código y actualizar contraseña'}</button>
          <button className="button-secondary w-full" type="button" disabled={isLoading} onClick={() => { setStep(1); setCodigo(''); setNuevaPassword(''); setError(''); setMessage('') }}>Usar otro correo</button>
        </form>}
      </section>
    </main>
  )
}
