export type UserRole = 'Admin' | 'User'

export interface AuthUser {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
}

export interface LoginResponse {
  message: string
  token: string
  user: AuthUser
}

export interface RegisterResponse {
  message: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

export interface MessageResponse {
  message: string
}
