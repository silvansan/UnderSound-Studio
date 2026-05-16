import '@/styles/globals.css'
import type { ReactNode } from 'react'

import { HashRouteRedirect } from '@/components/HashRouteRedirect'

export const metadata = {
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
  title: 'UnderSound',
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
