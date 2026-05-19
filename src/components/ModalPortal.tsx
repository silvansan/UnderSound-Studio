'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ModalPortalProps = {
  children: React.ReactNode
  lockScroll?: boolean
}

export function ModalPortal({ children, lockScroll = true }: ModalPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!lockScroll) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [lockScroll])

  if (!mounted) {
    return null
  }

  return createPortal(children, document.body)
}
