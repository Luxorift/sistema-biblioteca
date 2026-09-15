import { useCallback, useEffect, useState } from 'react'
import { AdminMaterial, AdminMiembro, AdminPerfil, getAdminData } from '../services/adminService'

export function useAdminData() {
  const [materiales, setMateriales] = useState<AdminMaterial[]>([])
  const [miembros, setMiembros] = useState<AdminMiembro[]>([])
  const [perfiles, setPerfiles] = useState<AdminPerfil[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const refresh = useCallback(async () => {
    setError('')
    try {
      const data = await getAdminData()
      setMateriales(data.materiales); setMiembros(data.miembros); setPerfiles(data.perfiles)
    } catch { setError('No fue posible cargar la información administrativa.') } finally { setIsLoading(false) }
  }, [])
  useEffect(() => { void refresh() }, [refresh])
  return { materiales, miembros, perfiles, isLoading, error, refresh }
}
