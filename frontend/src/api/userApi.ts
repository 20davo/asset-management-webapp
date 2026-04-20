import api from './axios'
import type { MessageResponse } from '../types/auth'
import type { ManagedUser, UpdateManagedUserRequest } from '../types/user'

export async function getUsers() {
  const response = await api.get<ManagedUser[]>('/users')
  return response.data
}

export async function getUser(userId: number) {
  const response = await api.get<ManagedUser>(`/users/${userId}`)
  return response.data
}

export async function updateUser(userId: number, data: UpdateManagedUserRequest) {
  const response = await api.put<ManagedUser>(`/users/${userId}`, data)
  return response.data
}

export async function deleteUser(userId: number) {
  const response = await api.delete<MessageResponse>(`/users/${userId}`)
  return response.data
}
