import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import type { EmailAdapter, PayloadRequest, TypedUser } from 'payload'

export type SmtpConfig = {
  from: string
  host: string
  pass?: string
  port: number
  user?: string
}

const localConsoleEmailAdapter: EmailAdapter<void> = ({ payload }) => ({
  defaultFromAddress: 'noreply@ablaut.local',
  defaultFromName: 'ablaut',
  name: 'console',
  sendEmail: async (message) => {
    const recipients = Array.isArray(message.to) ? message.to.join(', ') : String(message.to ?? '')
    payload.logger.info({
      msg: `Email attempted without SMTP configuration. To: '${recipients}', Subject: '${message.subject ?? ''}'`,
    })
  },
})

let hasWarnedAboutMissingSmtp = false

type AuthEmailArgs = {
  req: PayloadRequest
  token: string
  user: TypedUser
}

function getBaseUrl() {
  return (
    process.env.PUBLIC_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    'http://localhost:3000'
  ).replace(/\/$/, '')
}

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderEmailShell(args: {
  ctaLabel: string
  ctaUrl: string
  eyebrow: string
  intro: string
  outro?: string
  title: string
}) {
  const { ctaLabel, ctaUrl, eyebrow, intro, outro, title } = args

  return `
    <div style="margin:0;padding:32px 16px;background:#eef5f4;font-family:Inter,Arial,sans-serif;color:#15313a;">
      <div style="max-width:640px;margin:0 auto;background:#fcfffd;border:1px solid rgba(22,63,53,0.14);border-radius:24px;overflow:hidden;box-shadow:0 18px 40px rgba(18,107,182,0.08);">
        <div style="padding:32px;background:linear-gradient(135deg,#163f35 0%,#126bb6 100%);color:#ffffff;">
          <div style="font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;opacity:0.8;">${escapeHtml(eyebrow)}</div>
          <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;font-weight:700;">${escapeHtml(title)}</h1>
        </div>
        <div style="padding:32px;">
          <p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:#15313a;">${escapeHtml(intro)}</p>
          <div style="margin:24px 0 28px;">
            <a href="${ctaUrl}" style="display:inline-block;padding:14px 20px;border-radius:16px;background:linear-gradient(135deg,#2f8f63 0%,#126bb6 100%);color:#ffffff;text-decoration:none;font-weight:700;">
              ${escapeHtml(ctaLabel)}
            </a>
          </div>
          <p style="margin:20px 0 0;font-size:12px;line-height:1.6;color:#5d7680;">If the button does not work, copy this link:</p>
          <p style="margin:4px 0 0;font-size:12px;line-height:1.6;color:#5d7680;word-break:break-word;">${escapeHtml(ctaUrl)}</p>
          ${
            outro
              ? `<p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#5d7680;">${escapeHtml(outro)}</p>`
              : ''
          }
        </div>
      </div>
    </div>
  `
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim()
  const port = process.env.SMTP_PORT?.trim()
  const from = process.env.SMTP_FROM?.trim()

  if (!host || !port || !from) {
    return null
  }

  return {
    from,
    host,
    pass: process.env.SMTP_PASS?.trim(),
    port: Number(port),
    user: process.env.SMTP_USER?.trim(),
  }
}

export async function buildEmailAdapter() {
  const smtp = getSmtpConfig()

  if (!smtp) {
    if (!hasWarnedAboutMissingSmtp) {
      console.warn('SMTP is not configured. Auth emails will log to the server console.')
      hasWarnedAboutMissingSmtp = true
    }
    return localConsoleEmailAdapter
  }

  return nodemailerAdapter({
    defaultFromAddress: smtp.from,
    defaultFromName: 'ablaut',
    skipVerify: true,
    transportOptions: {
      auth:
        smtp.user || smtp.pass
          ? {
              pass: smtp.pass,
              user: smtp.user,
            }
          : undefined,
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
    },
  })
}

export function generateVerificationEmailHTML({ token, user }: AuthEmailArgs) {
  const email = typeof user.email === 'string' ? user.email : 'your account'
  const url = joinUrl(getBaseUrl(), `/reset-password/${token}`)

  return renderEmailShell({
    ctaLabel: 'Verify account',
    ctaUrl: url,
    eyebrow: 'ablaut account',
    intro: `Verify ${email} to finish activating your ablaut access. This link also lets you set or update your password.`,
    title: 'Confirm your email',
  })
}

export function generateVerificationEmailSubject() {
  return 'Verify your ablaut account'
}

export function generateForgotPasswordEmailHTML({ token, user }: Partial<AuthEmailArgs> = {}) {
  const email = typeof user?.email === 'string' ? user.email : 'your account'
  const safeToken = token ?? ''
  const url = joinUrl(getBaseUrl(), `/reset-password/${safeToken}`)

  return renderEmailShell({
    ctaLabel: 'Reset password',
    ctaUrl: url,
    eyebrow: 'ablaut security',
    intro: `A password reset was requested for ${email}. Use the button below to choose a new password.`,
    outro: 'If you did not request this, you can ignore this email.',
    title: 'Reset your password',
  })
}

export function generateForgotPasswordEmailSubject() {
  return 'Reset your ablaut password'
}

export function generateInvitedUserActivationEmailHTML(args: { activationUrl: string; email: string }) {
  return renderEmailShell({
    ctaLabel: 'Activate account and set password',
    ctaUrl: args.activationUrl,
    eyebrow: 'ablaut invitation',
    intro: `You were invited to ablaut (${args.email}). Use the button below once to choose your password, then sign in.`,
    title: 'Activate your account',
  })
}

export function generateInvitedUserActivationEmailSubject() {
  return 'Activate your ablaut account'
}

export function generateOrganizationRequestEmailHTML(args: {
  manageUrl: string
  organizationName: string
  requesterEmail: string
}) {
  return renderEmailShell({
    ctaLabel: 'Review request',
    ctaUrl: args.manageUrl,
    eyebrow: 'ablaut organization',
    intro: `${args.requesterEmail} requested to join ${args.organizationName}. Review the request in user management.`,
    title: 'New organization membership request',
  })
}

export function generateOrganizationRequestEmailSubject(args: { organizationName: string }) {
  return `ablaut membership request: ${args.organizationName}`
}

export function generateOrganizationMembershipApprovedEmailHTML(args: {
  dashboardUrl: string
  organizationName: string
  recipientEmail: string
}) {
  return renderEmailShell({
    ctaLabel: 'Open dashboard',
    ctaUrl: args.dashboardUrl,
    eyebrow: 'ablaut organization',
    intro: `Your request to join ${args.organizationName} was approved. You can sign in and work with that organization's events.`,
    title: 'Membership approved',
  })
}

export function generateOrganizationMembershipApprovedEmailSubject(args: { organizationName: string }) {
  return `You were added to ${args.organizationName}`
}

export function generateOrganizationMembershipRejectedEmailHTML(args: {
  organizationName: string
  recipientEmail: string
}) {
  return renderEmailShell({
    ctaLabel: 'Sign in',
    ctaUrl: joinUrl(getBaseUrl(), '/'),
    eyebrow: 'ablaut organization',
    intro: `Your request to join ${args.organizationName} was not approved. Contact the organization manager if you think this was a mistake.`,
    title: 'Membership request declined',
  })
}

export function generateOrganizationMembershipRejectedEmailSubject(args: { organizationName: string }) {
  return `Membership request: ${args.organizationName}`
}

export function generateSpeakerPasswordChangedEmailHTML(args: {
  channelName?: string
  eventTitle?: string
  manageUrl: string
  recipientEmail: string
}) {
  const scope = [args.eventTitle, args.channelName].filter(Boolean).join(' / ') || 'an ablaut speaker page'

  return renderEmailShell({
    ctaLabel: 'Review event',
    ctaUrl: args.manageUrl,
    eyebrow: 'ablaut security',
    intro: `The speaker password for ${scope} was changed. This notice was sent to ${args.recipientEmail}.`,
    outro: 'If this was unexpected, review event assignments and speaker links.',
    title: 'Speaker password changed',
  })
}

export function generateSpeakerPasswordChangedEmailSubject() {
  return 'ablaut speaker password changed'
}

export function generateEventAssignmentEmailHTML(args: {
  eventTitle: string
  eventUrl: string
  recipientEmail: string
  roleForEvent: string
}) {
  return renderEmailShell({
    ctaLabel: 'Open event',
    ctaUrl: args.eventUrl,
    eyebrow: 'ablaut assignment',
    intro: `${args.recipientEmail} was assigned as ${args.roleForEvent} for ${args.eventTitle}.`,
    title: 'You were assigned to an event',
  })
}

export function generateEventAssignmentEmailSubject(args: { eventTitle: string }) {
  return `ablaut event assignment: ${args.eventTitle}`
}

export { getBaseUrl, joinUrl }
