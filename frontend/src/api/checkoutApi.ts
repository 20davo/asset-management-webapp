import api from './axios'
import type { CheckoutItem } from '../types/checkout'

export async function getMyCheckouts() {
  const response = await api.get<CheckoutItem[]>('/checkout/my')
  return response.data
}