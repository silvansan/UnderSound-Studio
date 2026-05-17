import '@/styles/globals.css'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { HashRouteRedirect } from '@/components/HashRouteRedirect'

export const metadata: Metadata = {
  description: 'UnderSound — live translation and audio for events',
  icons: {
    apple: '/apple-icon.png',
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        sizes: '32x32',
        type: 'image/png',
        url: '/icon.png',
      },
      {
        sizes: '32x32',
        type: 'image/png',
        url: '/favicon.png',
      },
    ],
    shortcut: '/favicon.ico',
  },
  title: {
    default: 'UnderSound Studio',
    template: '%s | UnderSound Studio',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <HashRouteRedirect />
        {children}
      </body>
    </html>
  )
}
