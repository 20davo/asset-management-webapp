import api from './axios'
import type {
  CreateCheckoutRequest,
  CreateEquipmentRequest,
  EquipmentActionResponse,
  EquipmentDetails,
  EquipmentListItem,
  EquipmentMutationResponse,
  ReturnCheckoutRequest,
  UpdateEquipmentRequest,
} from '../types/equipment'

export async function getEquipments() {
  const response = await api.get<EquipmentListItem[]>('/equipment')
  return response.data
}

export async function getEquipmentById(id: number) {
  const response = await api.get<EquipmentDetails>(`/equipment/${id}`)
  return response.data
}

export async function checkoutEquipment(id: number, data: CreateCheckoutRequest) {
  const response = await api.post<EquipmentActionResponse>(
    `/equipment/${id}/checkout`,
    data,
  )
  return response.data
}

export async function returnEquipment(id: number, data: ReturnCheckoutRequest) {
  const response = await api.post<EquipmentActionResponse>(
    `/equipment/${id}/return`,
    data,
  )
  return response.data
}

export async function createEquipment(data: CreateEquipmentRequest) {
  const response = await api.post<EquipmentMutationResponse>('/equipment', data)
  return response.data
}

export async function updateEquipment(id: number, data: UpdateEquipmentRequest) {
  const response = await api.put<EquipmentMutationResponse>(`/equipment/${id}`, data)
  return response.data
}

export async function deleteEquipment(id: number) {
  const response = await api.delete<EquipmentMutationResponse>(`/equipment/${id}`)
  return response.data
}

export async function markEquipmentMaintenance(id: number) {
  const response = await api.post<EquipmentMutationResponse>(
    `/equipment/${id}/mark-maintenance`,
  )
  return response.data
}

export async function markEquipmentAvailable(id: number) {
  const response = await api.post<EquipmentMutationResponse>(
    `/equipment/${id}/mark-available`,
  )
  return response.data
}