import '@/styles/globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  description: 'UnderSound — live translation and audio for events',
  title: 'UnderSound',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
