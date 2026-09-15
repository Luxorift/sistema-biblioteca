import { FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { requestRecoveryCode, validateRecoveryCode } from '../services/supabase/recuperacion'

export function RecuperarPassword() {
  const [perfilId, setPerfilId] = useState('')
  const [codigo, setCodigo] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isRequesting, setIsRequesting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsRequesting(true)
    try {
      await requestRecoveryCode(perfilId.trim())
      setMessage('Su código fue generado. Solicítelo al personal autorizado: vence en 10 minutos.')
    } catch {
      setError('No fue posible generar el código. Verifique su identificador de perfil e inténtelo otra vez.')
    } finally {
      setIsRequesting(false)
    }
  }

  async function handleValidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setMessage('')
    setIsValidating(true)
    try {
      const isValid = await validateRecoveryCode(perfilId.trim(), codigo.trim())
      if (!isValid) {
        setError('El código no es válido, ya fue usado o venció. Solicite uno nuevo.')
        return
      }
      setMessage('Código validado correctamente. Continúe con el restablecimiento de contraseña.')
    } catch {
      setError('No pudimos validar el código. Inténtelo nuevamente.')
    } finally {
      setIsValidating(false)
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-8 sm:py-14">
      <Link className="inline-block min-h-touch font-bold text-brand-blue underline" to="/login">Volver a iniciar sesión</Link>
      <section className="card mt-5" aria-labelledby="recovery-title">
        <h1 id="recovery-title" className="m-0 text-3xl font-extrabold">Recuperar contraseña</h1>
        <p className="text-slate-700">Solicite un código temporal y escríbalo antes de que venza.</p>
        {error && <div className="rounded-lg border-2 border-danger bg-red-50 p-4 font-semibold text-danger" role="alert">{error}</div>}
        {message && <div className="rounded-lg border-2 border-success bg-green-50 p-4 font-semibold text-success" role="status">{message}</div>}
        <form className="mt-6 space-y-4" onSubmit={handleRequest}>
          <label className="block font-bold" htmlFor="perfil-id">Identificador de perfil
            <input id="perfil-id" required value={perfilId} onChange={(e) => setPerfilId(e.target.value)} className="mt-2 min-h-touch w-full rounded-lg border-2 border-slate-700 px-4 py-3" aria-describedby="perfil-help" />
          </label>
          <p id="perfil-help" className="m-0 text-slate-700">Es el identificador asignado a su cuenta.</p>
          <button className="button-primary w-full" type="submit" disabled={isRequesting}>{isRequesting ? 'Generando código…' : 'Solicitar código temporal'}</button>
        </form>
        <form className="mt-8 border-t-2 border-slate-300 pt-6" onSubmit={handleValidate}>
          <label className="block font-bold" htmlFor="codigo">Código de 6 dígitos
            <input id="codigo" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ''))} className="mt-2 min-h-touch w-full rounded-lg border-2 border-slate-700 px-4 py-3 text-2xl tracking-[0.3em]" />
          </label>
          <button className="button-secondary mt-4 w-full" type="submit" disabled={isValidating}>{isValidating ? 'Verificando código…' : 'Verificar código'}</button>
        </form>
      </section>
    </main>
  )
}
