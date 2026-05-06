import { cleanup, render, screen } from '@testing-library/react'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FeedbackMessage } from './FeedbackMessage'

describe('FeedbackMessage', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    vi.useRealTimers()
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

  it('shows a temporary floating message when the original message is outside the viewport', async () => {
    vi.useFakeTimers()
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
      bottom: -16,
      height: 24,
      left: 0,
      right: 200,
      top: -40,
      width: 200,
      x: 0,
      y: -40,
      toJSON: () => undefined,
    })

    render(<FeedbackMessage type="success" message="Saved successfully." />)

    expect(screen.getAllByText('Saved successfully.')).toHaveLength(2)
    expect(screen.getByRole('status')).toHaveTextContent('Saved successfully.')

    await act(async () => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Saved successfully.')).toHaveClass('form-success')
  })

  it('hides the floating message when the original message becomes visible again', () => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      callback(0)
      return 1
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)

    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValueOnce({
        bottom: -16,
        height: 24,
        left: 0,
        right: 200,
        top: -40,
        width: 200,
        x: 0,
        y: -40,
        toJSON: () => undefined,
      })
      .mockReturnValue({
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

    expect(screen.getByRole('status')).toBeInTheDocument()

    act(() => {
      window.dispatchEvent(new Event('scroll'))
    })

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByText('Something went wrong.')).toHaveClass('form-error')
    expect(rectSpy).toHaveBeenCalled()
  })

  it('updates the visible message when a new message is received', () => {
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

    const { rerender } = render(
      <FeedbackMessage type="success" message="Saved successfully." />,
    )

    rerender(<FeedbackMessage type="error" message="Something went wrong." />)

    expect(screen.queryByText('Saved successfully.')).not.toBeInTheDocument()
    expect(screen.getByText('Something went wrong.')).toHaveClass('form-error')
  })
})
