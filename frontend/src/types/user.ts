import type { UserRole } from './auth'

export interface ManagedUser {
  id: number
  name: string
  email: string
  role: UserRole
}
