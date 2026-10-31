import { Link, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { useEnfocarAlCambiar } from '@/lib/useEnfocarAlCambiar'
import { ImportarInventario } from './components/ImportarInventario'
import { ExportarDatos } from './components/ExportarDatos'

export function IntercambioDatosPage() {
  const [parametros, setParametros] = useSearchParams()
  const tab = parametros.get('tab') === 'exportar' ? 'exportar' : 'importar'
  const referencia = useEnfocarAlCambiar(tab)
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h1 className="text-3xl font-bold">Importar y exportar Excel</h1>
        <p className="text-tinta-suave text-xl">
          Carga inventarios con revisión previa y descarga los datos de tu biblioteca.
        </p>
        <Link className="text-primario font-bold underline" to="/">
          Volver al inicio
        </Link>
      </header>
      <nav className="flex flex-wrap gap-3" aria-label="Importación y exportación">
        <Button
          variante={tab === 'importar' ? 'primario' : 'secundario'}
          aria-current={tab === 'importar' ? 'page' : undefined}
          onClick={() => setParametros({ tab: 'importar' })}
        >
          Importar inventario
        </Button>
        <Button
          variante={tab === 'exportar' ? 'primario' : 'secundario'}
          aria-current={tab === 'exportar' ? 'page' : undefined}
          onClick={() => setParametros({ tab: 'exportar' })}
        >
          Exportar biblioteca
        </Button>
      </nav>
      <section ref={referencia} tabIndex={-1} className="destino-flujo">
        <div hidden={tab !== 'importar'}>
          <ImportarInventario />
        </div>
        <div hidden={tab !== 'exportar'}>
          <ExportarDatos />
        </div>
      </section>
    </div>
  )
}
