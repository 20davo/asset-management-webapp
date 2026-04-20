import type { SetURLSearchParams } from 'react-router-dom'

export function getEnumSearchParam<T extends string>(
  searchParams: URLSearchParams,
  key: string,
  allowedValues: readonly T[],
  fallbackValue: T,
) {
  const value = searchParams.get(key)

  if (value && allowedValues.includes(value as T)) {
    return value as T
  }

  return fallbackValue
}

export function getTextSearchParam(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key) ?? ''
}

export function setMergedSearchParams(
  setSearchParams: SetURLSearchParams,
  updates: Record<string, string | null | undefined>,
) {
  setSearchParams(
    (previous) => {
      const next = new URLSearchParams(previous)

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          next.delete(key)
          return
        }

        next.set(key, value)
      })

      return next
    },
    { replace: true },
  )
}

export function toggleSortSearchParams(
  setSearchParams: SetURLSearchParams,
  fieldKey: string,
  directionKey: string,
  field: string,
  defaultDirection: 'asc' | 'desc' = 'asc',
) {
  setSearchParams(
    (previous) => {
      const next = new URLSearchParams(previous)
      const currentField = previous.get(fieldKey)
      const currentDirection = previous.get(directionKey)

      next.set(fieldKey, field)

      if (currentField === field) {
        next.set(directionKey, currentDirection === 'desc' ? 'asc' : 'desc')
      } else {
        next.set(directionKey, defaultDirection)
      }

      return next
    },
    { replace: true },
  )
}
