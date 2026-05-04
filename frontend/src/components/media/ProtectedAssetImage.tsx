import { useEffect, useState } from 'react'
import axios from 'axios'
import { handleUnauthorizedResponse } from '../../api/axios'
import { resolveAssetImageUrl } from '../../utils/assetImages'
import { getToken } from '../../utils/tokenStorage'

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
  const directSrc =
    imageUrl && isDirectImageSource(imageUrl) ? imageUrl : null
  const [protectedImage, setProtectedImage] = useState<{
    imageUrl: string
    resolvedSrc: string | null
  } | null>(null)

  useEffect(() => {
    if (!imageUrl || directSrc) {
      return
    }

    const requestedImageUrl = imageUrl
    const token = getToken()
    const targetUrl = resolveAssetImageUrl(requestedImageUrl)

    if (!token || !targetUrl) {
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
        setProtectedImage({
          imageUrl: requestedImageUrl,
          resolvedSrc: objectUrl,
        })
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          handleUnauthorizedResponse(requestUrl)
        }

        if (!isCancelled) {
          setProtectedImage({
            imageUrl: requestedImageUrl,
            resolvedSrc: null,
          })
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
  }, [directSrc, imageUrl])

  const resolvedSrc =
    directSrc ?? (protectedImage && protectedImage.imageUrl === imageUrl ? protectedImage.resolvedSrc : null)

  if (!resolvedSrc) {
    return (
      <div className={placeholderClassName}>
        <span>{placeholderText}</span>
      </div>
    )
  }

  return <img className={className} src={resolvedSrc} alt={alt} />
}
