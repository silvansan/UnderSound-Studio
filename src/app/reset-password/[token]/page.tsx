import type { Metadata } from 'next'
import Link from 'next/link'

import { Layout } from '@/components/Layout'
import { ResetPasswordForm } from '@/components/ResetPasswordForm'
import { pageMetadata } from '@/lib/branding'

type PageProps = {
  params: Promise<{ token: string }>
}

export const metadata: Metadata = pageMetadata('Set new password')

export const dynamic = 'force-dynamic'

export default async function ResetPasswordPage({ params }: PageProps) {
  const { token } = await params

  return (
    <Layout requireAuth={false} title="Set New Password">
      <section className="mx-auto max-w-xl">
        <article className="us-panel px-6 py-7 md:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--us-blue-dark)' }}>
            Account recovery
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight" style={{ color: 'var(--us-green-dark)' }}>
            Choose a new password
          </h2>
          <p className="mt-3 text-sm leading-7" style={{ color: 'var(--us-muted)' }}>
            Use the secure reset link from your email to set a new password.
          </p>
          <div className="mt-6">
            <ResetPasswordForm token={token} />
          </div>
          <Link href="/" className="mt-5 inline-flex text-sm font-medium" style={{ color: 'var(--us-blue-dark)' }}>
            Back to login
          </Link>
        </article>
      </section>
    </Layout>
  )
}
