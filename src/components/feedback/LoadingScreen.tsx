import { IndicadorCarga } from './IndicadorCarga'

export function LoadingScreen() {
  return (
    <div className="grid min-h-dvh place-items-center bg-papel">
      <IndicadorCarga
        mensaje="Iniciando biblioteca…"
        subtexto="Comprobando credenciales y preparando el sistema escolar."
        pantallaCompleta
      />
    </div>
  )
}
