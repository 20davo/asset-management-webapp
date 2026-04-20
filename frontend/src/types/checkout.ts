import type { EquipmentStatus } from './equipment'

export interface CheckoutEquipment {
  id: number
  name: string
  category: string
  imageUrl: string | null
  serialNumber: string
  status: EquipmentStatus
}

export interface CheckoutUser {
  id: number
  name: string
  email: string
}

export interface CheckoutItem {
  id: number
  checkedOutAt: string
  dueAt: string
  returnedAt: string | null
  note: string | null
  equipment: CheckoutEquipment
  user: CheckoutUser
}
