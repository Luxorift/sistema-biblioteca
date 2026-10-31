import { irAlPaso } from '@/lib/guiarNavegacion'
import { useEnfocarAlCambiar } from '@/lib/useEnfocarAlCambiar'
import { useState } from 'react'
import { ConsultarCredencial, type PersonaCredencial } from '@/features/personas'
import { ArrowLeft, BookDown, BookUp, ClipboardList } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { DevolverPage } from '@/features/devoluciones'
import { HistorialPrestamosPage } from './HistorialPrestamosPage'
import { PrestarPage } from './PrestarPage'

export type TabPrestamos = 'devolver' | 'prestar' | 'historial'

interface Props {
  tabInicial?: TabPrestamos
}

export function PrestamosPage({ tabInicial }: Props) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [personaCredencial, setPersonaCredencial] = useState<PersonaCredencial | null>(
    null,
  )
  const tabParam = searchParams.get('tab') as TabPrestamos | null

  // Determinar pestaña activa: URL param -> prop inicial -> 'devolver' (lo más frecuente)
  const tabActiva: TabPrestamos =
    tabParam === 'devolver' || tabParam === 'prestar' || tabParam === 'historial'
      ? tabParam
      : (tabInicial ?? 'devolver')

  const contenidoRef = useEnfocarAlCambiar(
    `${tabActiva}-${searchParams.get('prestamoId') ?? ''}-${personaCredencial?.id ?? ''}`,
  )

  const cambiarTab = (nuevaTab: TabPrestamos) => {
    setSearchParams({ tab: nuevaTab }, { replace: true })
    if (nuevaTab === tabActiva) irAlPaso(contenidoRef)
  }

  return (
    <div className="space-y-6">
      {/* Barra de pestañas unificada del mostrador con UN SOLO botón de volver al inicio */}
      <div className="border-borde border-b-2 pb-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Mostrador de préstamos y devoluciones</h1>
            <p className="text-tinta-suave text-xl">
              Entrega libros a personas, registra devoluciones y consulta préstamos
              pendientes o morosos.
            </p>
          </div>
          <Link
            to="/"
            className="border-borde hover:bg-papel inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 bg-white px-5 text-lg font-bold transition-all active:scale-[0.98]"
          >
            <ArrowLeft aria-hidden size={20} />
            Volver al inicio
          </Link>
        </div>

        <nav
          className="flex flex-wrap gap-3"
          aria-label="Pestañas de préstamos y devoluciones"
        >
          <button
            type="button"
            onClick={() => cambiarTab('devolver')}
            aria-current={tabActiva === 'devolver' ? 'page' : undefined}
            className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-lg font-bold transition-colors ${
              tabActiva === 'devolver'
                ? 'bg-primario text-white shadow-xs'
                : 'text-tinta border-borde hover:bg-papel border-2 bg-white'
            }`}
          >
            <BookDown aria-hidden size={22} />
            Devolver material
          </button>
          <button
            type="button"
            onClick={() => cambiarTab('prestar')}
            aria-current={tabActiva === 'prestar' ? 'page' : undefined}
            className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-lg font-bold transition-colors ${
              tabActiva === 'prestar'
                ? 'bg-primario text-white shadow-xs'
                : 'text-tinta border-borde hover:bg-papel border-2 bg-white'
            }`}
          >
            <BookUp aria-hidden size={22} />
            Prestar material
          </button>
          <button
            type="button"
            onClick={() => cambiarTab('historial')}
            aria-current={tabActiva === 'historial' ? 'page' : undefined}
            className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-lg font-bold transition-colors ${
              tabActiva === 'historial'
                ? 'bg-primario text-white shadow-xs'
                : 'text-tinta border-borde hover:bg-papel border-2 bg-white'
            }`}
          >
            <ClipboardList aria-hidden size={22} />
            Historial y morosos
          </button>
        </nav>
      </div>

      <ConsultarCredencial
        onPrestar={(persona) => {
          setPersonaCredencial(persona)
          setSearchParams({ tab: 'prestar' }, { replace: true })
        }}
      />
      {/* Contenido sin encabezado duplicado */}
      <section
        ref={contenidoRef}
        tabIndex={-1}
        className="destino-flujo"
        aria-label="Contenido del mostrador"
      >
        {tabActiva === 'devolver' && <DevolverPage ocultarEncabezado />}
        {tabActiva === 'prestar' && (
          <PrestarPage
            key={personaCredencial?.id ?? 'sin-credencial'}
            ocultarEncabezado
            personaInicial={
              personaCredencial
                ? {
                    id: personaCredencial.id,
                    nombreCompleto: `${personaCredencial.apellidoPaterno} ${personaCredencial.apellidoMaterno ?? ''}, ${personaCredencial.nombres}`,
                    dni: personaCredencial.dni,
                    tipo: personaCredencial.tipoPersona,
                  }
                : undefined
            }
          />
        )}
        {tabActiva === 'historial' && <HistorialPrestamosPage ocultarEncabezado />}
      </section>
    </div>
  )
}
