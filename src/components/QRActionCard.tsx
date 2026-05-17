import { DownloadIcon, OpenLinkIcon } from '@/components/ActionIcons'
import { QRPopup } from '@/components/QRPopup'

type QRActionCardProps = {
  fileName: string
  label: 'Listener' | 'Speaker' | string
  qrDataUrl: string
  url: string
}

export function QRActionCard({ fileName, label, qrDataUrl, url }: QRActionCardProps) {
  return (
    <article className="us-panel px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--us-blue-dark)' }}>
            Link
          </p>
          <h3 className="mt-1 text-lg font-semibold" style={{ color: 'var(--us-green-dark)' }}>
            {label}
          </h3>
        </div>
        <div className="flex gap-2">
          <QRPopup fileName={fileName} label={label} qrDataUrl={qrDataUrl} url={url} />
          <a
            aria-label={`Download ${label} QR PNG`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/80 transition hover:-translate-y-0.5 hover:shadow-md"
            download={fileName}
            href={qrDataUrl}
            style={{ borderColor: 'var(--us-border)', color: 'var(--us-blue-dark)' }}
            title={`Download ${label} QR PNG`}
          >
            <DownloadIcon />
          </a>
          <a
            aria-label={`Open ${label} link`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border bg-white/80 transition hover:-translate-y-0.5 hover:shadow-md"
            href={url}
            rel="noreferrer"
            style={{ borderColor: 'var(--us-border)', color: 'var(--us-blue-dark)' }}
            target="_blank"
            title={`Open ${label} link`}
          >
            <OpenLinkIcon />
          </a>
        </div>
      </div>
    </article>
  )
}
