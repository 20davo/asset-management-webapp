import axios from 'axios'
import { getToken } from '../utils/tokenStorage'

const DEFAULT_API_BASE_URL = 'http://localhost:5071/api'
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

export const API_BASE_URL = (
  configuredApiBaseUrl && configuredApiBaseUrl.length > 0
    ? configuredApiBaseUrl
    : DEFAULT_API_BASE_URL
).replace(/\/+$/, '')
export const API_ORIGIN = new URL(API_BASE_URL).origin

const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = getToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default api
