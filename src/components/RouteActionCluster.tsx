'use client'

import { IconActionLink } from '@/components/ActionIcons'
import { QRPopup } from '@/components/QRPopup'

export type RouteActionVariant = 'listener' | 'speaker'

type RouteActionClusterProps = {
  disabled?: boolean
  openLabel: string
  qrDataUrl?: string
  qrFileName?: string
  qrLabel: string
  qrTriggerLabel?: string
  url: string
  variant: RouteActionVariant
}

export function RouteActionCluster({
  disabled = false,
  openLabel,
  qrDataUrl,
  qrFileName,
  qrLabel,
  qrTriggerLabel,
  url,
  variant,
}: RouteActionClusterProps) {
  return (
    <div
      aria-label={variant === 'speaker' ? 'Speaker links' : 'Listener links'}
      className={`us-route-cluster us-route-cluster-${variant}${disabled ? ' us-route-cluster-disabled' : ''}`}
      role="group"
    >
      {qrDataUrl ? (
        <QRPopup
          appearance="cluster-inner"
          clusterVariant={variant}
          fileName={qrFileName}
          label={qrLabel}
          qrDataUrl={qrDataUrl}
          triggerLabel={qrTriggerLabel ?? `${qrLabel} QR`}
          url={url}
        />
      ) : null}
      <IconActionLink appearance="cluster-inner" clusterVariant={variant} href={url} icon="open" target="_blank">
        {openLabel}
      </IconActionLink>
      {disabled ? <span className="us-route-cluster-off">Off</span> : null}
    </div>
  )
}
