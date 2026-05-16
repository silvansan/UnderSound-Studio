import '@/styles/globals.css'
import type { ReactNode } from 'react'

import { HashRouteRedirect } from '@/components/HashRouteRedirect'

export const metadata = {
  description: 'UnderSound — live translation and audio for events',
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
