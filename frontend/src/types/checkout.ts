export interface CheckoutEquipment {
  id: number
  name: string
  category: string
  serialNumber: string
  status: string
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