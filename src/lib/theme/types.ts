export type Tema = 'claro' | 'oscuro'

export interface ThemeContextType {
  tema: Tema
  alternarTema: () => void
}
