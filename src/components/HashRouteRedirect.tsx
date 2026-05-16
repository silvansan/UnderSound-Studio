'use client'

import { useEffect } from 'react'

const routePrefixes = ['/dashboard', '/events', '/listen', '/speak', '/settings']

function normalizeHashRoute(hash: string): string | null {
  const value = hash.replace(/^#\/?/, '/').split('?')[0]

  if (!routePrefixes.some((prefix) => value === prefix || value.startsWith(`${prefix}/`))) {
    return null
  }

  return value
}

export function HashRouteRedirect() {
  useEffect(() => {
    const nextPath = normalizeHashRoute(window.location.hash)

    if (nextPath && nextPath !== window.location.pathname) {
      window.location.replace(nextPath)
    }
  }, [])

  return null
}
