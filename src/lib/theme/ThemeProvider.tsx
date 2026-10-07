import { useEffect, useState, type ReactNode } from 'react'
import { ThemeContext } from './ThemeContext'
import type { Tema } from './types'

const CLAVE_STORAGE = 'tema-biblioteca'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(() => {
    // 1. Preferencia guardada en localStorage
    const guardado = localStorage.getItem(CLAVE_STORAGE) as Tema | null
    if (guardado === 'claro' || guardado === 'oscuro') {
      return guardado
    }
    // 2. Preferencia del sistema operativo
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'oscuro'
    }
    return 'claro'
  })

  useEffect(() => {
    const raiz = document.documentElement
    if (tema === 'oscuro') {
      raiz.classList.add('dark')
    } else {
      raiz.classList.remove('dark')
    }
    localStorage.setItem(CLAVE_STORAGE, tema)
  }, [tema])

  const alternarTema = () => {
    setTema((prev) => (prev === 'claro' ? 'oscuro' : 'claro'))
  }

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  )
}
