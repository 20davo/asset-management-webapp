export interface EquipmentListItem {
  id: number
  name: string
  category: string
  description: string | null
  serialNumber: string
  status: string
  createdAt: string
}

export interface CheckoutHistoryItem {
  id: number
  checkedOutAt: string
  dueAt: string
  returnedAt: string | null
  note: string | null
  userId: number
  userName: string
  userEmail: string
}

export interface EquipmentDetails {
  id: number
  name: string
  category: string
  description: string | null
  serialNumber: string
  status: string
  createdAt: string
  checkouts: CheckoutHistoryItem[]
}

export interface CreateCheckoutRequest {
  dueAt: string
  note?: string
}

export interface ReturnCheckoutRequest {
  note?: string
}

export interface EquipmentActionResponse {
  message: string
  equipmentId: number
  checkoutId: number
}

export interface CreateEquipmentRequest {
  name: string
  category: string
  description?: string
  serialNumber: string
}

export interface UpdateEquipmentRequest {
  name: string
  category: string
  description?: string
  serialNumber: string
}

export interface EquipmentMutationResponse {
  message: string
  equipmentId: number
}