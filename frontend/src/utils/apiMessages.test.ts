import { describe, expect, it } from 'vitest'
import { getApiMessage } from './apiMessages'

describe('getApiMessage', () => {
  it('returns the message for the selected language', () => {
    expect(getApiMessage('equipment.notFound', 'en')).toBe('Asset not found.')
    expect(getApiMessage('auth.invalidCredentials', 'hu')).toBe('Hibás email vagy jelszó.')
  })

  it('returns null for unknown or invalid codes', () => {
    expect(getApiMessage('unknown.code', 'en')).toBeNull()
    expect(getApiMessage(null, 'en')).toBeNull()
  })
})
