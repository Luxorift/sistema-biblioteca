import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/features/auth'
import { fechaBiblioteca } from '@/lib/fechas'
import { obtenerExportacion } from '../api'

export function ExportarDatos() {
  const { perfil } = useAuth()
  const [incluirUsuarios, setIncluirUsuarios] = useState(false)
  const exportacion = useMutation({
    mutationFn: async () => {
      const datos = await obtenerExportacion(incluirUsuarios)
      const { crearExcelExportacion, descargarExcel } = await import('../exportarExcel')
      descargarExcel(
        await crearExcelExportacion(datos),
        `biblioteca-${fechaBiblioteca()}.xlsx`,
      )
      return datos
    },
  })
  return (
    <section className="space-y-5" aria-label="Exportar datos de la biblioteca">
      <h2 className="text-2xl font-bold">Exportar la biblioteca a Excel</h2>
      <p>
        Descarga un archivo con hojas separadas para materiales, ejemplares y ubicaciones,
        personas de todos los tipos —incluidos alumnos—, préstamos y devoluciones,
        catálogos e historial de importaciones.
      </p>
      <p>
        Incluye códigos, DNI, correos, cantidades, estados y fechas. Las fechas se
        muestran con la hora de Perú. Se exportan todos los registros, no solo la página
        visible.
      </p>
      {perfil?.rol === 'admin' && (
        <label className="flex min-h-12 items-center gap-3">
          <input
            type="checkbox"
            checked={incluirUsuarios}
            onChange={(e) => setIncluirUsuarios(e.target.checked)}
          />
          Incluir nombres, roles y estado de los usuarios del sistema, sin contraseñas ni
          claves
        </label>
      )}
      <Button disabled={exportacion.isPending} onClick={() => exportacion.mutate()}>
        {exportacion.isPending ? 'Preparando Excel…' : 'Descargar Excel de la biblioteca'}
      </Button>
      {exportacion.isError && <Alert>{exportacion.error.message}</Alert>}
      {exportacion.isSuccess && (
        <p role="status">
          Excel preparado y descarga iniciada. Revisa la carpeta de descargas de tu
          navegador.
        </p>
      )}
      <p className="text-tinta-suave">
        Este archivo sirve para consultar y conservar tus datos; no reemplaza una copia
        completa de la base de datos ni restaura sesiones o permisos.
      </p>
    </section>
  )
}
