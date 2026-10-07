import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { TextField } from '@/components/ui/TextField'
import { EditarMaterialDialog } from './components/EditarMaterialDialog'
import type { MaterialEncontrado } from './types'
import { useBuscarMateriales } from './useBuscarMateriales'

function contiene(texto: string, busqueda: string) {
  return texto.toLocaleLowerCase().includes(busqueda.trim().toLocaleLowerCase())
}

export function BuscarMaterialPage() {
  const consulta = useBuscarMateriales()
  const [titulo, setTitulo] = useState('')
  const [autor, setAutor] = useState('')
  const [editorial, setEditorial] = useState('')
  const [anio, setAnio] = useState('')
  const [tipo, setTipo] = useState('')
  const [categoria, setCategoria] = useState('')
  const [disponibilidad, setDisponibilidad] = useState('')
  const [materialEditar, setMaterialEditar] = useState<MaterialEncontrado | null>(null)
  const [exitoEdicion, setExitoEdicion] = useState(false)
  const materiales = useMemo(() => consulta.data ?? [], [consulta.data])
  const filtrados = useMemo(
    () =>
      materiales.filter((material) => {
        const disponibles = material.copias.some((copia) => copia.estado === 'disponible')
        return (
          contiene(material.titulo, titulo) &&
          (!autor || material.autores.some((nombre) => contiene(nombre, autor))) &&
          contiene(material.editorial ?? '', editorial) &&
          contiene(String(material.anio ?? ''), anio) &&
          (!tipo || material.tipo === tipo) &&
          (!categoria || material.categoria === categoria) &&
          (!disponibilidad ||
            (disponibilidad === 'disponible' ? disponibles : !disponibles))
        )
      }),
    [materiales, titulo, autor, editorial, anio, tipo, categoria, disponibilidad],
  )
  const opciones = (campo: (material: MaterialEncontrado) => string | null) =>
    [
      ...new Set(
        materiales.map(campo).filter((valor): valor is string => Boolean(valor)),
      ),
    ].sort()
  const limpiar = () => {
    setTitulo('')
    setAutor('')
    setEditorial('')
    setAnio('')
    setTipo('')
    setCategoria('')
    setDisponibilidad('')
  }
  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Buscar material</h1>
          <p className="text-tinta-suave text-xl">
            Revisa el inventario y filtra por los datos que necesitas.
          </p>
        </div>
        <Link
          to="/"
          className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-5 text-lg font-bold"
        >
          Volver al inicio
        </Link>
      </div>
      {consulta.isLoading && <p aria-live="polite">Cargando materiales…</p>}
      {consulta.isError && (
        <Alert>
          No se pudo cargar el inventario. Intenta recargar la página. Si continúa, avisa
          al administrador.
        </Alert>
      )}
      {exitoEdicion && (
        <Alert>
          Los datos del material se guardaron correctamente. Revisa la tabla si hace falta.
        </Alert>
      )}
      {consulta.isSuccess && (
        <>
          <section className="border-borde space-y-4 rounded-2xl border-2 bg-white p-5">
            <h2 className="text-2xl font-bold">Filtros</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <TextField
                label="Título"
                value={titulo}
                onChange={(evento) => setTitulo(evento.target.value)}
              />
              <TextField
                label="Autor"
                value={autor}
                onChange={(evento) => setAutor(evento.target.value)}
              />
              <TextField
                label="Editorial"
                value={editorial}
                onChange={(evento) => setEditorial(evento.target.value)}
              />
              <TextField
                label="Año"
                inputMode="numeric"
                value={anio}
                onChange={(evento) => setAnio(evento.target.value)}
              />
              <Select
                label="Tipo"
                value={tipo}
                onChange={(evento) => setTipo(evento.target.value)}
              >
                <option value="">Todos los tipos</option>
                {opciones((material) => material.tipo).map((opcion) => (
                  <option key={opcion}>{opcion}</option>
                ))}
              </Select>
              <Select
                label="Área o categoría"
                value={categoria}
                onChange={(evento) => setCategoria(evento.target.value)}
              >
                <option value="">Todas las áreas</option>
                {opciones((material) => material.categoria).map((opcion) => (
                  <option key={opcion}>{opcion}</option>
                ))}
              </Select>
              <Select
                label="Disponibilidad"
                value={disponibilidad}
                onChange={(evento) => setDisponibilidad(evento.target.value)}
              >
                <option value="">Todas</option>
                <option value="disponible">Con copias disponibles</option>
                <option value="sin-disponibles">Sin copias disponibles</option>
              </Select>
            </div>
            <Button variante="secundario" onClick={limpiar}>
              Limpiar filtros
            </Button>
          </section>
          <p className="text-tinta-suave" aria-live="polite">
            {filtrados.length}{' '}
            {filtrados.length === 1 ? 'material encontrado' : 'materiales encontrados'}.
          </p>
          {filtrados.length === 0 ? (
            <section className="border-borde rounded-2xl border-2 bg-white p-5">
              <h2 className="text-2xl font-bold">No hay resultados con esos filtros</h2>
              <p>Prueba quitando un filtro o busca otro dato.</p>
            </section>
          ) : (
            <div className="border-borde overflow-x-auto rounded-2xl border-2 bg-white">
              <table className="w-full min-w-[1100px] border-collapse text-left">
                <thead className="bg-papel">
                  <tr>
                    <th className="p-4">Título</th>
                    <th className="p-4">Autor</th>
                    <th className="p-4">Editorial</th>
                    <th className="p-4">Año</th>
                    <th className="p-4">Tipo</th>
                    <th className="p-4">Área</th>
                    <th className="p-4">Copias</th>
                    <th className="p-4">Disponibles</th>
                    <th className="p-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((material) => {
                    const disponibles = material.copias.filter(
                      (copia) => copia.estado === 'disponible',
                    ).length
                    return (
                      <tr key={material.id} className="border-borde border-t-2">
                        <td className="p-4 font-bold">{material.titulo}</td>
                        <td className="p-4">{material.autores.join(', ') || '—'}</td>
                        <td className="p-4">{material.editorial ?? '—'}</td>
                        <td className="p-4">{material.anio ?? '—'}</td>
                        <td className="p-4">{material.tipo}</td>
                        <td className="p-4">{material.categoria ?? '—'}</td>
                        <td className="p-4">{material.copias.length}</td>
                        <td className="p-4">{disponibles}</td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variante="secundario"
                              onClick={() => {
                                setExitoEdicion(false)
                                setMaterialEditar(material)
                              }}
                            >
                              Editar
                            </Button>
                            <Link
                              to={`/etiquetas?materialId=${material.id}`}
                              className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-3 text-base font-bold"
                            >
                              Etiquetas
                            </Link>
                            <Link
                              to={`/ejemplares?materialId=${material.id}`}
                              className="border-borde inline-flex min-h-12 items-center justify-center rounded-xl border-2 bg-white px-3 text-base font-bold"
                            >
                              Copias
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      <EditarMaterialDialog
        key={materialEditar ? String(materialEditar.id) : 'cerrado'}
        material={materialEditar}
        abierto={Boolean(materialEditar)}
        onCerrar={() => setMaterialEditar(null)}
        onGuardado={() => setExitoEdicion(true)}
      />
    </div>
  )
}
