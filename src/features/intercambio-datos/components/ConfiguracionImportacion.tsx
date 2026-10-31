import { TextField } from '@/components/ui/TextField'
import { Select } from '@/components/ui/Select'
import { camposExcel, type ArchivoInventario, type ConfiguracionHoja } from '../types'

interface Props {
  archivo: ArchivoInventario
  configuracion: Record<string, ConfiguracionHoja>
  onCambiar: (nombre: string, configuracion: ConfiguracionHoja) => void
  tipoGeneral: string
  onTipoGeneral: (valor: string) => void
  separarAutores: boolean
  onSepararAutores: (valor: boolean) => void
  tipos: string[]
}
export function ConfiguracionImportacion({
  archivo,
  configuracion,
  onCambiar,
  tipoGeneral,
  onTipoGeneral,
  separarAutores,
  onSepararAutores,
  tipos,
}: Props) {
  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-bold">1. Revisa las hojas y columnas</h2>
      <p>
        {archivo.nombre}: {archivo.hojas.length} hojas de inventario reconocidas. Las
        hojas sin cabecera de título se omiten.
      </p>
      <TextField
        label="Tipo para las filas que no lo indican"
        list="tipos-importacion"
        placeholder="Elige o escribe: Libro, Manual, Enciclopedia…"
        value={tipoGeneral}
        onChange={(e) => onTipoGeneral(e.target.value)}
      />
      <datalist id="tipos-importacion">
        {tipos.map((tipo) => (
          <option key={tipo} value={tipo} />
        ))}
      </datalist>
      <label className="flex min-h-12 items-center gap-3">
        <input
          type="checkbox"
          checked={separarAutores}
          onChange={(e) => onSepararAutores(e.target.checked)}
        />
        Interpretar /, ; y saltos de línea como separadores de autores
      </label>
      <p className="text-tinta-suave">
        El tipo también se puede elegir por hoja o corregir por fila. La categoría
        sugerida es el nombre de cada hoja.
      </p>
      {archivo.hojas.map((hoja) => {
        const ajuste = configuracion[hoja.nombre]
        return (
          <details
            key={hoja.nombre}
            className="border-borde rounded-xl border-2 bg-white p-4"
          >
            <summary className="min-h-12 cursor-pointer font-bold">
              {hoja.nombre} · {hoja.filas.length} filas a revisar · cabecera en fila{' '}
              {hoja.encabezado}
            </summary>
            <div className="space-y-4 pt-3">
              <label className="flex min-h-12 items-center gap-3">
                <input
                  type="checkbox"
                  checked={ajuste.incluir}
                  onChange={(e) =>
                    onCambiar(hoja.nombre, { ...ajuste, incluir: e.target.checked })
                  }
                />
                Importar esta hoja
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <TextField
                  label={`Categoría de ${hoja.nombre}`}
                  value={ajuste.categoria}
                  onChange={(e) =>
                    onCambiar(hoja.nombre, { ...ajuste, categoria: e.target.value })
                  }
                />
                <TextField
                  label={`Tipo de ${hoja.nombre}`}
                  list="tipos-importacion"
                  placeholder="Usar el tipo general"
                  value={ajuste.tipo}
                  onChange={(e) =>
                    onCambiar(hoja.nombre, { ...ajuste, tipo: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {camposExcel.map((campo) => (
                  <Select
                    key={campo}
                    label={`Columna ${campo} (${hoja.nombre})`}
                    value={ajuste.mapeo[campo]}
                    onChange={(e) =>
                      onCambiar(hoja.nombre, {
                        ...ajuste,
                        mapeo: { ...ajuste.mapeo, [campo]: Number(e.target.value) },
                      })
                    }
                  >
                    <option value={-1}>No está en la hoja</option>
                    {hoja.columnas.map((c, i) => (
                      <option key={i} value={i}>
                        {c}
                      </option>
                    ))}
                  </Select>
                ))}
              </div>
            </div>
          </details>
        )
      })}
    </div>
  )
}
