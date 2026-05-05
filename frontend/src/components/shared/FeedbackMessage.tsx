import { useCallback, useEffect, useRef, useState } from 'react'

interface FeedbackMessageProps {
  message: string
  type: 'error' | 'success'
}

const FLOATING_MESSAGE_TIMEOUT_MS = 5000

export function FeedbackMessage({ message, type }: FeedbackMessageProps) {
  const messageRef = useRef<HTMLParagraphElement>(null)
  const timeoutRef = useRef<number | null>(null)
  const [showFloatingMessage, setShowFloatingMessage] = useState(false)

  const className = type === 'error' ? 'form-error' : 'form-success'

  const isOriginalMessageVisible = useCallback(() => {
    const element = messageRef.current

    if (!element) {
      return true
    }

    const rect = element.getBoundingClientRect()

    return rect.bottom > 0 && rect.top < window.innerHeight
  }, [])

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (!message) {
      return
    }

    const updateFloatingMessage = () => {
      if (isOriginalMessageVisible()) {
        setShowFloatingMessage(false)
        return
      }

      setShowFloatingMessage(true)
      timeoutRef.current = window.setTimeout(() => {
        setShowFloatingMessage(false)
        timeoutRef.current = null
      }, FLOATING_MESSAGE_TIMEOUT_MS)
    }

    const animationFrameId = window.requestAnimationFrame(updateFloatingMessage)

    const handleViewportChange = () => {
      if (isOriginalMessageVisible()) {
        setShowFloatingMessage(false)
      }
    }

    window.addEventListener('scroll', handleViewportChange, { passive: true })
    window.addEventListener('resize', handleViewportChange)

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      window.removeEventListener('scroll', handleViewportChange)
      window.removeEventListener('resize', handleViewportChange)

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isOriginalMessageVisible, message])

  return (
    <>
      <p ref={messageRef} className={className}>
        {message}
      </p>

      {showFloatingMessage && (
        <div className="floating-feedback" role="status" aria-live="polite">
          <p className={className}>{message}</p>
        </div>
      )}
    </>
  )
}
