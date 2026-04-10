import { useEffect, useState } from 'react'
import axios from 'axios'
import { handleUnauthorizedResponse } from '../api/axios'
import { getToken } from '../utils/tokenStorage'
import { resolveAssetImageUrl } from '../utils/assetImages'

interface ProtectedAssetImageProps {
  imageUrl: string | null | undefined
  alt: string
  className: string
  placeholderClassName: string
  placeholderText: string
}

function isDirectImageSource(url: string) {
  return (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  )
}

export function ProtectedAssetImage({
  imageUrl,
  alt,
  className,
  placeholderClassName,
  placeholderText,
}: ProtectedAssetImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!imageUrl) {
      setResolvedSrc(null)
      return
    }

    if (isDirectImageSource(imageUrl)) {
      setResolvedSrc(imageUrl)
      return
    }

    const token = getToken()
    const targetUrl = resolveAssetImageUrl(imageUrl)

    if (!token || !targetUrl) {
      setResolvedSrc(null)
      return
    }

    const requestUrl = targetUrl
    let isCancelled = false
    let objectUrl: string | null = null

    async function loadProtectedImage() {
      try {
        const response = await axios.get(requestUrl, {
          responseType: 'blob',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (isCancelled) {
          return
        }

        objectUrl = URL.createObjectURL(response.data)
        setResolvedSrc(objectUrl)
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          handleUnauthorizedResponse(requestUrl)
        }

        if (!isCancelled) {
          setResolvedSrc(null)
        }
      }
    }

    void loadProtectedImage()

    return () => {
      isCancelled = true

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [imageUrl])

  if (!resolvedSrc) {
    return (
      <div className={placeholderClassName}>
        <span>{placeholderText}</span>
      </div>
    )
  }

  return <img className={className} src={resolvedSrc} alt={alt} />
}
