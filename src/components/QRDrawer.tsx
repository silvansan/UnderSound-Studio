'use client'

import { useState } from 'react'

type QRDrawerProps = {
  label: string
  url: string
}

export function QRDrawer({ label, url }: QRDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-lg border" style={{ borderColor: 'var(--us-green-light)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left font-medium"
        style={{ color: 'var(--us-green-dark)' }}
      >
        {open ? `Hide ${label}` : `Show ${label}`}
        <span aria-hidden>{open ? '−' : '+'}</span>
      </button>
      {open ? (
        <div className="space-y-3 border-t px-4 py-3" style={{ borderColor: 'var(--us-green-light)' }}>
          <p className="break-all text-sm" style={{ color: 'var(--us-muted)' }}>
            {url}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-sm text-white"
              style={{ backgroundColor: 'var(--us-green)' }}
              onClick={() => navigator.clipboard.writeText(url)}
            >
              Copy link
            </button>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--us-bg)' }}
            >
              Open link
            </a>
          </div>
        </div>
      ) : null}
    </div>
  )
}
