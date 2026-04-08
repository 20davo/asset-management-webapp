import axios from 'axios'
import { getToken } from '../utils/tokenStorage'

export const API_BASE_URL = 'http://localhost:5071/api'
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
