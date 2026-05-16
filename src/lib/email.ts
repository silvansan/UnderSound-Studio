export type SmtpConfig = {
  host: string
  port: number
  user?: string
  pass?: string
  from: string
}

export function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT
  const from = process.env.SMTP_FROM

  if (!host || !port || !from) {
    return null
  }

  return {
    host,
    port: Number(port),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from,
  }
}
