import api from './axios'
import type { ManagedUser } from '../types/user'

export async function getUsers() {
  const response = await api.get<ManagedUser[]>('/users')
  return response.data
}
