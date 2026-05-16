'use client'

import Image from 'next/image'
import { useState } from 'react'

import { MinusIcon, PlusIcon, QRCodeIcon } from '@/components/ActionIcons'

type QRDrawerProps = {
  fileName?: string
  label: string
  qrDataUrl: string
  url: string
}

export function QRDrawer({ fileName, label, qrDataUrl, url }: QRDrawerProps) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [open, setOpen] = useState(false)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <div className="us-panel overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-4 text-left font-medium"
        style={{
          color: 'var(--us-green-dark)',
          background: 'linear-gradient(135deg, rgba(47, 143, 99, 0.08), rgba(38, 167, 242, 0.06))',
        }}
      >
        <span className="flex items-center gap-2">
          <QRCodeIcon />
          {open ? `Hide ${label}` : `Show ${label}`}
        </span>
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.72)', color: 'var(--us-blue-dark)' }}
        >
          {open ? <MinusIcon /> : <PlusIcon />}
        </span>
      </button>
      {open ? (
        <div className="space-y-3 border-t px-4 py-4" style={{ borderColor: 'var(--us-border)' }}>
          <div
            className="flex items-center justify-center rounded-2xl border px-4 py-5"
            style={{
              borderColor: 'rgba(38, 167, 242, 0.28)',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.96), rgba(38, 167, 242, 0.04))',
            }}
          >
            <div className="text-center">
              <Image
                src={qrDataUrl}
                alt={`${label} code for ${url}`}
                height={224}
                unoptimized
                width={224}
                className="mx-auto h-56 w-56 rounded-2xl bg-white p-3 shadow-[0_18px_32px_rgba(18,107,182,0.18)]"
              />
              <p className="text-sm font-medium" style={{ color: 'var(--us-green-dark)' }}>
                Scan to open
              </p>
              <p className="text-xs" style={{ color: 'var(--us-muted)' }}>
                UnderSound branded QR using the stable public route.
              </p>
            </div>
          </div>
          <p className="break-all text-sm" style={{ color: 'var(--us-muted)' }}>
            {url}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="us-button-primary px-3 py-2 text-sm font-medium"
              onClick={copyLink}
            >
              {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Copy failed' : 'Copy link'}
            </button>
            <a
              href={qrDataUrl}
              download={fileName ?? `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`}
              className="us-button-secondary px-3 py-2 text-sm font-medium"
            >
              Download PNG
            </a>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="us-button-secondary px-3 py-2 text-sm font-medium"
            >
              Open link
            </a>
          </div>
        </div>
      ) : null}
    </div>
  )
}
