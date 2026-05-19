import { APP_STUDIO_NAME } from '@/lib/branding'

export function PayloadDashboardLink() {
  return (
    <div className="ablaut-admin-dashboard-link">
      <a href="/dashboard">Back to {APP_STUDIO_NAME}</a>
    </div>
  )
}
