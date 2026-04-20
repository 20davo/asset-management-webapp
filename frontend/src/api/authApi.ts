import api from './axios'
import type {
  ChangePasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  RegisterResponse,
} from '../types/auth'

export async function login(data: LoginRequest) {
  const response = await api.post<LoginResponse>('/auth/login', data)
  return response.data
}

export async function register(data: RegisterRequest) {
  const response = await api.post<RegisterResponse>('/auth/register', data)
  return response.data
}

export async function changePassword(data: ChangePasswordRequest) {
  const response = await api.post<MessageResponse>('/auth/change-password', data)
  return response.data
}
