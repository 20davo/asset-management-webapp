import { describe, expect, it } from 'vitest'
import { getApiMessage } from './apiMessages'

describe('getApiMessage', () => {
  it('returns the message for the selected language', () => {
    expect(getApiMessage('equipment.notFound', 'en')).toBe('Asset not found.')
    expect(getApiMessage('auth.invalidCredentials', 'hu')).toBe('Hibás email vagy jelszó.')
  })

  it('returns messages for important workflow response codes', () => {
    expect(getApiMessage('equipment.assigned', 'en')).toBe('Asset assigned successfully.')
    expect(getApiMessage('equipment.returned', 'en')).toBe('Asset returned successfully.')
    expect(getApiMessage('equipment.maintenanceMarked', 'en')).toBe(
      'Asset moved to maintenance.',
    )
    expect(getApiMessage('user.deleted', 'en')).toBe('User and related records deleted.')
  })

  it('returns null for unknown or invalid codes', () => {
    expect(getApiMessage('unknown.code', 'en')).toBeNull()
    expect(getApiMessage(null, 'en')).toBeNull()
  })
})
