import { APP_PRODUCT_NAME, APP_STUDIO_NAME } from '@/lib/branding'

export function PayloadDashboardIntro() {
  return (
    <section className="ablaut-admin-intro">
      <div>
        <p>Advanced back office</p>
        <h2>Payload admin is for super admins.</h2>
        <span>
          Use the main {APP_STUDIO_NAME} dashboard for daily event, channel, user, and assignment work. The product name
          remains {APP_PRODUCT_NAME}.
        </span>
      </div>
      <a href="/dashboard">Open app dashboard</a>
    </section>
  )
}
