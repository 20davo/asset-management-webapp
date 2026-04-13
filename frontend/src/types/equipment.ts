export interface EquipmentListItem {
  id: number
  name: string
  category: string
  description: string | null
  imageUrl: string | null
  serialNumber: string
  status: string
  createdAt: string
  activeCheckoutUserName: string | null
  activeCheckoutDueAt: string | null
  maintenanceByUserName: string | null
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
  imageUrl: string | null
  serialNumber: string
  status: string
  createdAt: string
  totalCheckoutCount: number
  lastCheckedOutAt: string | null
  activeCheckoutDueAt: string | null
  activeCheckoutUserName: string | null
  canReturn: boolean
  isCheckedOutByCurrentUser: boolean
  checkouts: CheckoutHistoryItem[]
}

export interface CreateCheckoutRequest {
  dueAt: string
  assignedUserId?: number
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
  image?: File | null
  serialNumber: string
}

export interface UpdateEquipmentRequest {
  name: string
  category: string
  description?: string
  image?: File | null
  removeImage?: boolean
  serialNumber: string
}

export interface EquipmentMutationResponse {
  message: string
  equipmentId: number
}
