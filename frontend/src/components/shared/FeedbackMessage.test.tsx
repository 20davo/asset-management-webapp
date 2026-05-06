import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackMessage } from './FeedbackMessage'

describe('FeedbackMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders a success message with the success class', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 24,
      height: 24,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    })

    render(<FeedbackMessage type="success" message="Saved successfully." />)

    expect(screen.getByText('Saved successfully.')).toHaveClass('form-success')
  })

  it('renders an error message with the error class', () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: 24,
      height: 24,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => undefined,
    })

    render(<FeedbackMessage type="error" message="Something went wrong." />)

    expect(screen.getByText('Something went wrong.')).toHaveClass('form-error')
  })
})
