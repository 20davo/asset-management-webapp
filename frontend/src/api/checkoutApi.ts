import api from './axios'
import type { CheckoutItem } from '../types/checkout'

export async function getAllCheckouts() {
  const response = await api.get<CheckoutItem[]>('/checkout')
  return response.data
}

export async function getMyCheckouts() {
  const response = await api.get<CheckoutItem[]>('/checkout/my')
  return response.data
}

export async function getUserCheckouts(userId: number) {
  const response = await api.get<CheckoutItem[]>(`/checkout/user/${userId}`)
  return response.data
}
