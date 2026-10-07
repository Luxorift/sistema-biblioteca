import { useState, type FormEvent } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { TextField } from '@/components/ui/TextField'
import { useCrearCatalogo, useCrearUbicacion } from '@/features/catalogos'
import type { TipoCatalogo } from '@/features/catalogos'

interface NuevoCatalogoDialogProps {
  abierto: boolean
  tipo: TipoCatalogo | 'ubicacion'
  onCerrar: () => void
  onCreado: (id: number) => void
}
const titulos = {
  tipos_material: 'Agregar tipo de material',
  categorias: 'Agregar categoría',
  ubicacion: 'Agregar ubicación',
}
export function NuevoCatalogoDialog({
  abierto,
  tipo,
  onCerrar,
  onCreado,
}: NuevoCatalogoDialogProps) {
  const [nombre, setNombre] = useState('')
  const [estante, setEstante] = useState('')
  const [nivel, setNivel] = useState('')
  const [error, setError] = useState<string | null>(null)
  const crearCatalogo = useCrearCatalogo(tipo === 'ubicacion' ? 'categorias' : tipo)
  const crearUbicacion = useCrearUbicacion()
  const guardar = async (evento: FormEvent) => {
    evento.preventDefault()
    setError(null)
    try {
      if (tipo === 'ubicacion') {
        if (
          !/^[a-zA-Z]$/.test(estante) ||
          !Number.isInteger(Number(nivel)) ||
          Number(nivel) < 1
        ) {
          setError('Escribe una letra de estante y un nivel mayor que cero.')
          return
        }
        const ubicacion = await crearUbicacion.mutateAsync({
          estante,
          nivel: Number(nivel),
        })
        onCreado(ubicacion.id)
      } else {
        if (!nombre.trim()) {
          setError('Escribe un nombre para continuar.')
          return
        }
        const catalogo = await crearCatalogo.mutateAsync(nombre)
        onCreado(catalogo.id)
      }
      setNombre('')
      setEstante('')
      setNivel('')
      onCerrar()
    } catch {
      setError(
        'No se pudo guardar. Revisa que no exista con el mismo nombre e intenta de nuevo.',
      )
    }
  }
  const guardando = crearCatalogo.isPending || crearUbicacion.isPending
  return (
    <Dialog abierto={abierto} titulo={titulos[tipo]} onCerrar={onCerrar}>
      <form onSubmit={guardar} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        {tipo === 'ubicacion' ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              label="Estante"
              maxLength={1}
              value={estante}
              onChange={(evento) => setEstante(evento.target.value.toUpperCase())}
            />
            <TextField
              label="Nivel"
              type="number"
              min="1"
              value={nivel}
              onChange={(evento) => setNivel(evento.target.value)}
            />
          </div>
        ) : (
          <TextField
            label="Nombre"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
            autoFocus
          />
        )}
        <Button type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </Button>
      </form>
    </Dialog>
  )
}
