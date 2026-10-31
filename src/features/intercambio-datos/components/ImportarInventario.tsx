import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { irAlPaso } from '@/lib/guiarNavegacion'
import { useEnfocarAlCambiar } from '@/lib/useEnfocarAlCambiar'
import { useAsistenteImportacion } from '../useAsistenteImportacion'
import { agruparMateriales } from '../prepararImportacion'
import { claveMaterial } from '../normalizacion'
import { ConfiguracionImportacion } from './ConfiguracionImportacion'
import { RevisionEquivalencias } from './RevisionEquivalencias'
import { RevisionFilas } from './RevisionFilas'
import { RevisionCoincidencias } from './RevisionCoincidencias'

export function ImportarInventario() {
  const asistente = useAsistenteImportacion()
  const contenidoRef = useEnfocarAlCambiar(String(asistente.paso))
  const erroresRef = useRef<HTMLElement>(null)
  const { archivo, paso, datos, carga, resultado } = asistente
  const cambiarPaso = (nuevo: number) => {
    asistente.setError('')
    asistente.setPaso(nuevo)
  }
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">Importar inventario desde Excel</h2>
      <p>
        Sube un .xlsx, revisa sus nombres y corrige los datos pendientes. No se guarda
        nada hasta confirmar el resumen final.
      </p>
      <label className="border-borde block space-y-2 rounded-xl border-2 bg-white p-4 font-bold">
        Archivo de inventario (.xlsx, hasta 10 MB)
        <input
          className="block min-h-12 w-full"
          type="file"
          accept=".xlsx"
          disabled={asistente.guardando || asistente.leyendo}
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void asistente.cargar(file)
            e.target.value = ''
          }}
        />
      </label>
      {asistente.leyendo && <p role="status">Leyendo el archivo…</p>}
      {asistente.contexto.isLoading && (
        <p role="status">Consultando catálogos y materiales existentes…</p>
      )}
      {asistente.contexto.isError && (
        <Alert>
          No se pudo consultar el inventario.{' '}
          <Button variante="secundario" onClick={() => void asistente.contexto.refetch()}>
            Reintentar conexión
          </Button>
        </Alert>
      )}
      {asistente.importada && !resultado && (
        <Alert>
          Este archivo ya fue importado el{' '}
          {new Date(asistente.importada.fecha).toLocaleDateString('es-PE')}. Se crearon{' '}
          {asistente.importada.ejemplares_creados} copias. No se volverá a cargar.
        </Alert>
      )}
      {asistente.error && (
        <section ref={erroresRef} tabIndex={-1} className="destino-flujo">
          <Alert>{asistente.error}</Alert>
        </section>
      )}
      {archivo && (
        <p className="text-tinta-suave">
          Archivo: {archivo.nombre} · Paso {Math.min(paso, 4)} de 4{' '}
          {paso === 5 ? '· Completado' : ''}
        </p>
      )}
      <section
        ref={contenidoRef}
        tabIndex={-1}
        className="destino-flujo space-y-5"
        aria-label="Paso de importación"
      >
        {archivo && paso === 1 && (
          <>
            <ConfiguracionImportacion
              archivo={archivo}
              configuracion={asistente.configuracion}
              onCambiar={(nombre, valor) =>
                asistente.setConfiguracion((prev) => ({ ...prev, [nombre]: valor }))
              }
              tipoGeneral={asistente.tipoGeneral}
              onTipoGeneral={asistente.setTipoGeneral}
              separarAutores={asistente.separarAutores}
              onSepararAutores={asistente.setSepararAutores}
              tipos={datos.catalogos.tipo.map((t) => t.nombre)}
            />
            <Button
              disabled={!asistente.contexto.isSuccess || Boolean(asistente.importada)}
              onClick={asistente.analizar}
            >
              Analizar equivalencias
            </Button>
          </>
        )}
        {paso === 2 && (
          <>
            <RevisionEquivalencias
              grupos={asistente.grupos}
              decisiones={asistente.decisiones}
              contexto={datos}
              onDecidir={(id, valor) =>
                asistente.setDecisiones((prev) => {
                  const nuevas = { ...prev }
                  if (valor) nuevas[id] = valor
                  else delete nuevas[id]
                  return nuevas
                })
              }
            />
            <p role="status">
              {asistente.gruposPendientes} grupos pendientes de decisión.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button variante="secundario" onClick={() => cambiarPaso(1)}>
                Volver a las hojas
              </Button>
              <Button
                disabled={asistente.gruposPendientes > 0}
                onClick={() => cambiarPaso(3)}
              >
                Revisar filas y coincidencias
              </Button>
            </div>
          </>
        )}
        {paso === 3 && (
          <>
            <h2 className="text-2xl font-bold">3. Revisa los datos antes de importar</h2>
            <RevisionFilas
              filas={asistente.filas}
              onCorregir={(id, valor) =>
                asistente.setCorrecciones((prev) => ({
                  ...prev,
                  [id]: { ...prev[id], ...valor },
                }))
              }
            />
            <RevisionCoincidencias
              filas={asistente.filas}
              contexto={datos}
              duplicados={asistente.duplicados}
              existentes={asistente.existentes}
              onDuplicado={(id, valor) =>
                asistente.setDuplicados((prev) => {
                  const nuevas = { ...prev }
                  if (valor) nuevas[id] = valor
                  else delete nuevas[id]
                  return nuevas
                })
              }
              onExistente={(id, valor) =>
                asistente.setExistentes((prev) => {
                  const nuevas = { ...prev }
                  if (valor) nuevas[id] = valor
                  else delete nuevas[id]
                  return nuevas
                })
              }
              onTodosExistentes={(valor) => {
                const claves = new Set(
                  datos.materiales.map((m) =>
                    claveMaterial(m.titulo, m.editorial, m.anio),
                  ),
                )
                asistente.setExistentes(
                  Object.fromEntries(
                    [...agruparMateriales(asistente.filas).keys()]
                      .filter((clave) => claves.has(clave))
                      .map((clave) => [clave, valor]),
                  ),
                )
              }}
            />
            {carga.pendientes.length > 0 && (
              <Alert>
                <p className="font-bold">
                  Quedan {carga.pendientes.length} revisiones antes de continuar.
                </p>
                <ul className="list-inside list-disc">
                  {carga.pendientes.slice(0, 8).map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </Alert>
            )}
            <div className="flex flex-wrap gap-3">
              <Button variante="secundario" onClick={() => cambiarPaso(2)}>
                Volver a equivalencias
              </Button>
              <Button
                disabled={carga.pendientes.length > 0}
                onClick={() => cambiarPaso(4)}
              >
                Ver resumen de importación
              </Button>
            </div>
          </>
        )}
        {paso === 4 && (
          <>
            <h2 className="text-2xl font-bold">4. Confirma la importación</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="font-bold">Filas que se guardarán</dt>
                <dd>{carga.filas.length}</dd>
              </div>
              <div>
                <dt className="font-bold">Materiales nuevos</dt>
                <dd>{carga.materialesNuevos}</dd>
              </div>
              <div>
                <dt className="font-bold">Copias nuevas con código y ubicación</dt>
                <dd>{carga.filas.reduce((n, f) => n + f.cantidad, 0)}</dd>
              </div>
              <div>
                <dt className="font-bold">Filas excluidas u omitidas</dt>
                <dd>{asistente.filas.length - carga.filas.length}</dd>
              </div>
            </dl>
            <p>
              Las fichas existentes conservarán sus datos. Se guardará el origen de cada
              fila y las equivalencias aprobadas.
            </p>
            <Alert>
              El archivo quedará marcado como importado para impedir cargas repetidas,
              incluidas las hojas que hayas omitido. Para cargar filas omitidas más
              adelante, usa un archivo corregido con esas filas.
            </Alert>
            {carga.pendientes.length > 0 && (
              <Alert>
                El inventario o la revisión cambiaron. Vuelve a revisar las filas antes de
                confirmar.
              </Alert>
            )}
            <div className="flex flex-wrap gap-3">
              <Button
                variante="secundario"
                disabled={asistente.guardando}
                onClick={() => cambiarPaso(3)}
              >
                Volver a revisar
              </Button>
              <Button
                disabled={
                  asistente.guardando ||
                  carga.pendientes.length > 0 ||
                  Boolean(asistente.importada)
                }
                onClick={() =>
                  void asistente.confirmar().then(() => irAlPaso(erroresRef))
                }
              >
                {asistente.guardando
                  ? 'Importando; espera la confirmación…'
                  : 'Confirmar e importar inventario'}
              </Button>
            </div>
          </>
        )}
        {paso === 5 && resultado && (
          <>
            <h2 className="text-2xl font-bold">
              {resultado.ya_importado
                ? 'El archivo ya estaba importado'
                : 'Inventario importado correctamente'}
            </h2>
            <p>
              {resultado.filas} filas · {resultado.materiales_nuevos} materiales nuevos ·{' '}
              {resultado.ejemplares_creados} copias.
            </p>
            <p>
              Los códigos y ubicaciones ya están disponibles en el inventario y las
              etiquetas.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="text-primario min-h-12 content-center font-bold underline"
                to="/materiales"
              >
                Revisar materiales
              </Link>
              <Link
                className="text-primario min-h-12 content-center font-bold underline"
                to="/etiquetas"
              >
                Imprimir etiquetas
              </Link>
            </div>
          </>
        )}
      </section>
      {!archivo && datos.importaciones.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xl font-bold">Últimas importaciones</h3>
          <ul>
            {datos.importaciones.slice(0, 10).map((i) => (
              <li key={i.id}>
                {i.nombre_archivo} · {new Date(i.fecha).toLocaleDateString('es-PE')} ·{' '}
                {i.ejemplares_creados} copias
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
