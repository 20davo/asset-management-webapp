import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type AppearanceMode = 'light' | 'dark'

const STORAGE_KEY = 'asset-management-appearance'

interface AppearanceContextValue {
  appearance: AppearanceMode
  setAppearance: (appearance: AppearanceMode) => void
  toggleAppearance: () => void
}

const AppearanceContext = createContext<AppearanceContextValue | undefined>(undefined)

interface AppearanceProviderProps {
  children: ReactNode
}

function getInitialAppearance(): AppearanceMode {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (stored === 'light' || stored === 'dark') {
    return stored
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function AppearanceProvider({ children }: AppearanceProviderProps) {
  const [appearance, setAppearance] = useState<AppearanceMode>(getInitialAppearance)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, appearance)
    document.documentElement.dataset.theme = appearance
    document.documentElement.style.colorScheme = appearance
  }, [appearance])

  const value = useMemo(
    () => ({
      appearance,
      setAppearance,
      toggleAppearance: () => {
        setAppearance((current) => (current === 'light' ? 'dark' : 'light'))
      },
    }),
    [appearance],
  )

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>
}

export function useAppearance() {
  const context = useContext(AppearanceContext)

  if (!context) {
    throw new Error('useAppearance must be used inside AppearanceProvider')
  }

  return context
}
