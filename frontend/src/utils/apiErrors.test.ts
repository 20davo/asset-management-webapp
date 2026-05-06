import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from './apiErrors'

function createAxiosError(data: unknown) {
  return {
    isAxiosError: true,
    response: { data },
  }
}

describe('getApiErrorMessage', () => {
  it('uses localized API messages before backend fallback messages', () => {
    const error = createAxiosError({
      code: 'equipment.notFound',
      message: 'Backend fallback message.',
    })

    expect(getApiErrorMessage(error, 'Fallback', 'en')).toBe('Asset not found.')
  })

  it('uses the backend message when the code is unknown', () => {
    const error = createAxiosError({
      code: 'unknown.code',
      message: 'Backend fallback message.',
    })

    expect(getApiErrorMessage(error, 'Fallback', 'en')).toBe('Backend fallback message.')
  })

  it('uses validation errors when the backend fallback message is empty', () => {
    const error = createAxiosError({
      message: '   ',
      errors: {
        Name: ['Name is required.'],
      },
    })

    expect(getApiErrorMessage(error, 'Fallback', 'en')).toBe('Name is required.')
  })

  it('uses the fallback when the backend response has no useful message', () => {
    const error = createAxiosError({
      message: '   ',
      errors: {},
    })

    expect(getApiErrorMessage(error, 'Fallback', 'en')).toBe('Fallback')
  })

  it('uses validation errors before the generic fallback', () => {
    const error = createAxiosError({
      errors: {
        Email: ['Please enter a valid email address.'],
      },
    })

    expect(getApiErrorMessage(error, 'Fallback', 'en')).toBe(
      'Please enter a valid email address.',
    )
  })

  it('uses the fallback for non-Axios errors', () => {
    expect(getApiErrorMessage(new Error('Unexpected'), 'Fallback', 'en')).toBe('Fallback')
  })
})
