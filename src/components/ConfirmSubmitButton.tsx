'use client'

import { useState } from 'react'

type ConfirmSubmitButtonProps = {
  children: string
  className?: string
  confirmMessage: string
  title?: string
}

export function ConfirmSubmitButton({
  children,
  className,
  confirmMessage,
  title = 'Confirm delete',
}: ConfirmSubmitButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className={className ?? 'rounded-2xl border px-4 py-2.5 text-sm font-medium'}
        onClick={() => setOpen(true)}
        style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }}
        type="button"
      >
        {children}
      </button>

      {open ? (
        <div
          aria-label={title}
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/42 px-4 py-6"
          onClick={() => setOpen(false)}
          role="dialog"
        >
          <div
            className="w-full max-w-[380px] rounded-3xl border bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            style={{ borderColor: 'var(--us-border)' }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-danger)' }}>
              Dangerous action
            </p>
            <h2 className="mt-2 text-xl font-semibold" style={{ color: 'var(--us-green-dark)' }}>
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: 'var(--us-muted)' }}>
              {confirmMessage}
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button className="us-button-secondary px-4 py-2.5 text-sm font-medium" onClick={() => setOpen(false)} type="button">
                Cancel
              </button>
              <button className="rounded-2xl border px-4 py-2.5 text-sm font-medium" style={{ borderColor: 'var(--us-danger)', color: 'var(--us-danger)' }} type="submit">
                {children}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
