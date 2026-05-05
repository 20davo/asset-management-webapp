import axios from 'axios'
import type { Language } from '../context/LanguageContext'
import { getApiMessage } from './apiMessages'

interface ApiErrorResponse {
  code?: unknown
  message?: unknown
  errors?: Record<string, unknown>
}

function getFirstValidationError(errors: ApiErrorResponse['errors']) {
  if (!errors) {
    return null
  }

  for (const value of Object.values(errors)) {
    if (Array.isArray(value)) {
      const firstString = value.find((item): item is string => typeof item === 'string')

      if (firstString) {
        return firstString
      }
    }

    if (typeof value === 'string') {
      return value
    }
  }

  return null
}

export function getApiErrorMessage(
  error: unknown,
  fallback: string,
  language: Language = 'hu',
) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return fallback
  }

  const data = error.response?.data
  const localizedMessage = getApiMessage(data?.code, language)

  if (localizedMessage) {
    return localizedMessage
  }

  if (typeof data?.message === 'string' && data.message.trim()) {
    return data.message
  }

  return getFirstValidationError(data?.errors) ?? fallback
}
