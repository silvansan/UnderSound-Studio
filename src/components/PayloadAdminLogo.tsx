import { APP_STUDIO_NAME } from '@/lib/branding'

export function PayloadAdminLogo() {
  return (
    <div className="ablaut-admin-logo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="ablaut logo" src="/ablaut-icon.png" />
      <span>{APP_STUDIO_NAME}</span>
    </div>
  )
}
