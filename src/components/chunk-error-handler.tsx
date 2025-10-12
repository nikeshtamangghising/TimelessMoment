'use client'

import { useEffect } from 'react'
import { setupChunkErrorHandler } from '@/lib/chunk-error-handler'

export default function ChunkErrorHandler() {
  useEffect(() => {
    setupChunkErrorHandler()
  }, [])

  return null
}
