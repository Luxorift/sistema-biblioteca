import { FormEvent, useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { useAuth } from '../hooks/useAuth'
import {
  getMaterialesDisponibles,
  getMiembros,
  getPrestamosActivos,
  marcarDevuelto,
  Material,
  Miembro,
  PrestamoActivo,
  registrarPrestamo,
  searchBiblioteca,
} from '../services/bibliotecaService'

type SearchResults = { materiales: Material[]; miembros: Miembro[] }

export function DashboardPage() {
  const { perfil, signOut } = useAuth()
  const [materiales, setMateriales] = useState<Material[]>([])
  const [miembros, setMiembros] = useState<Miembro[]>([])
  const [prestamos, setPrestamos] = useState<PrestamoActivo[]>([])
  const [materialId, setMaterialId] = useState('')
  const [miembroId, setMiembroId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function refreshDashboard() {
    const [nextMateriales, nextMiembros, nextPrestamos] = await Promise.all([
      getMaterialesDisponibles(), getMiembros(), getPrestamosActivos(),
    ])
    setMateriales(nextMateriales)
    setMiembros(nextMiembros)
    setPrestamos(nextPrestamos)
  }

  useEffect(() => {
    refreshDashboard().catch(() => setError('No pudimos cargar los datos. Actualice la página o inténtelo nuevamente.'))
  }, [])

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    try {
      setSearchResults(await searchBiblioteca(searchTerm))
    } catch {
      setError('No fue posible realizar la búsqueda. Inténtelo nuevamente.')
    }
  }

  async function handleLoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!perfil || !materialId || !miembroId) {
      setError('Seleccione un material y un miembro antes de registrar el préstamo.')
      return
    }
    setError('')
    setNotice('')
    setIsSaving(true)
    try {
      await registrarPrestamo(materialId, miembroId, perfil.id)
      setMaterialId('')
      setMiembroId('')
      setNotice('Préstamo registrado correctamente.')
      await refreshDashboard()
    } catch {
      setError('No pudimos registrar el préstamo. Revise la información e inténtelo de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReturn(prestamo: PrestamoActivo) {
    setError('')
    setNotice('')
    try {
      await marcarDevuelto(prestamo.id, prestamo.material)
      setNotice('La devolución fue registrada correctamente.')
      await refreshDashboard()
    } catch {
      setError('No pudimos registrar la devolución. Inténtelo nuevamente.')
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
      <header className="flex flex-col gap-4 border-b-4 border-brand-blue pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="m-0 font-bold text-brand-blue">Sistema de Biblioteca</p><h1 className="mt-1 text-3xl font-extrabold">Panel del bibliotecario</h1><p className="m-0 text-slate-700">Hola, {perfil?.nombre}. ¿Qué desea hacer?</p></div>
        <Button variant="secondary" onClick={() => signOut()}>Cerrar sesión</Button>
      </header>

      <Card className="mt-6 border-brand-blue" aria-labelledby="buscar-title">
        <h2 id="buscar-title" className="m-0 text-2xl font-bold">Buscar en la biblioteca</h2>
        <p className="mt-1 text-slate-700">Busque un título, autor, ISBN, DNI o nombre del miembro.</p>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={handleSearch}>
          <div className="flex-1"><Input id="busqueda" label="Término de búsqueda" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Ejemplo: García Márquez o 12345678" /></div>
          <Button type="submit" className="sm:mt-10">Buscar</Button>
        </form>
        {searchResults && <div className="mt-5 grid gap-5 md:grid-cols-2" aria-live="polite">
          <SearchList title="Materiales encontrados" emptyMessage="No hay materiales que coincidan." items={searchResults.materiales.map((item) => `${item.titulo} · ${item.tipo}`)} />
          <SearchList title="Miembros encontrados" emptyMessage="No hay miembros que coincidan." items={searchResults.miembros.map((item) => `${item.nombre_completo} · DNI/código: ${item.codigo}`)} />
        </div>}
      </Card>

      {(error || notice) && <div className={`mt-6 rounded-lg border-2 p-4 font-semibold ${error ? 'border-danger bg-red-50 text-danger' : 'border-success bg-green-50 text-success'}`} role={error ? 'alert' : 'status'}>{error || notice}</div>}

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card aria-labelledby="prestamo-title">
          <h2 id="prestamo-title" className="m-0 text-2xl font-bold">Nuevo préstamo</h2>
          <p className="mt-1 text-slate-700">Elija el material y la persona. Luego confirme con un solo botón.</p>
          <form className="mt-5 space-y-5" onSubmit={handleLoan}>
            <Selection label="Material disponible" id="material" value={materialId} onChange={setMaterialId} placeholder="Seleccione un material" options={materiales.map((item) => ({ value: item.id, label: `${item.titulo} (${item.tipo})` }))} />
            <Selection label="Miembro" id="miembro" value={miembroId} onChange={setMiembroId} placeholder="Seleccione un miembro" options={miembros.map((item) => ({ value: item.id, label: `${item.nombre_completo} — ${item.codigo}` }))} />
            <Button type="submit" className="w-full text-xl" disabled={isSaving}>{isSaving ? 'Registrando préstamo…' : 'Registrar préstamo'}</Button>
          </form>
        </Card>

        <Card aria-labelledby="devoluciones-title">
          <h2 id="devoluciones-title" className="m-0 text-2xl font-bold">Devoluciones pendientes</h2>
          <p className="mt-1 text-slate-700">Préstamos activos que esperan devolución.</p>
          <div className="mt-5 space-y-4" aria-live="polite">
            {prestamos.length === 0 ? <p className="rounded-lg bg-green-50 p-4 font-semibold text-success">No hay devoluciones pendientes.</p> : prestamos.map((prestamo) => <article key={prestamo.id} className="rounded-lg border-2 border-slate-300 p-4"><h3 className="m-0 text-xl font-bold">{prestamo.materiales?.titulo ?? 'Material sin nombre'}</h3><p className="my-2 text-slate-700">Prestado a: <strong>{prestamo.miembros?.nombre_completo ?? 'Miembro sin nombre'}</strong> ({prestamo.miembros?.codigo ?? 'sin código'})</p><Button variant="secondary" className="w-full" onClick={() => handleReturn(prestamo)}>Marcar devuelto</Button></article>)}
          </div>
        </Card>
      </div>
    </main>
  )
}

function SearchList({ title, emptyMessage, items }: { title: string; emptyMessage: string; items: string[] }) {
  return <div><h3 className="m-0 text-xl font-bold">{title}</h3>{items.length ? <ul className="mt-2 space-y-2 pl-6">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-2 text-slate-700">{emptyMessage}</p>}</div>
}

function Selection({ label, id, value, onChange, placeholder, options }: { label: string; id: string; value: string; onChange: (value: string) => void; placeholder: string; options: { value: string; label: string }[] }) {
  return <div><label className="mb-2 block font-bold" htmlFor={id}>{label}</label><select id={id} required value={value} onChange={(event) => onChange(event.target.value)} className="min-h-touch w-full rounded-lg border-2 border-slate-700 bg-white px-4 py-3 text-lg"><option value="">{placeholder}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
}
