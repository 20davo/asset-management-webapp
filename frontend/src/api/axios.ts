import axios from 'axios'
import { getToken } from '../utils/tokenStorage'

const DEFAULT_API_BASE_URL = 'http://localhost:5071/api'
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const absoluteUrlPattern = /^https?:\/\//i
let unauthorizedHandler: (() => void) | null = null
let forbiddenHandler: (() => void) | null = null

export const API_BASE_URL = (
  configuredApiBaseUrl && configuredApiBaseUrl.length > 0
    ? configuredApiBaseUrl
    : DEFAULT_API_BASE_URL
).replace(/\/+$/, '')

export const API_ORIGIN = absoluteUrlPattern.test(API_BASE_URL)
  ? new URL(API_BASE_URL).origin
  : typeof window !== 'undefined'
    ? window.location.origin
    : ''

const api = axios.create({
  baseURL: API_BASE_URL,
})

function isAuthRequest(url: string | undefined) {
  if (!url) {
    return false
  }

  return url.includes('/auth/login') || url.includes('/auth/register')
}

function handleUnauthorizedResponse(url: string | undefined) {
  if (!getToken() || isAuthRequest(url)) {
    return
  }

  unauthorizedHandler?.()
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

function handleForbiddenResponse(url: string | undefined) {
  if (!getToken() || isAuthRequest(url)) {
    return
  }

  forbiddenHandler?.()
}

export function setForbiddenHandler(handler: (() => void) | null) {
  forbiddenHandler = handler
}

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        handleUnauthorizedResponse(error.config?.url)
      }

      if (error.response?.status === 403) {
        handleForbiddenResponse(error.config?.url)
      }
    }

    return Promise.reject(error)
  },
)

export { handleForbiddenResponse, handleUnauthorizedResponse }
export default api
