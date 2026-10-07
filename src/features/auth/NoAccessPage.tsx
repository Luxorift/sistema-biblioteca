import { Button } from '@/components/ui/Button'
import { useAuth } from './useAuth'

// El usuario existe en Supabase Auth pero no tiene perfil activo: el administrador debe habilitarlo.
export function NoAccessPage() {
  const { salir } = useAuth()

  return (
    <main className="mx-auto grid min-h-dvh max-w-xl content-center gap-6 p-6">
      <h1 className="text-3xl font-bold">Tu cuenta aún no tiene acceso</h1>
      <p className="text-tinta-suave text-xl">
        Tu usuario existe, pero el administrador todavía no lo habilitó. Avísale y vuelve
        a entrar.
      </p>
      <Button variante="secundario" onClick={salir} className="self-start">
        Salir
      </Button>
    </main>
  )
}
