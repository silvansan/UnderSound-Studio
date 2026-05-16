export function shouldUseSecureCookies(): boolean {
  const publicUrl = process.env.PUBLIC_BASE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim()

  if (publicUrl) {
    return publicUrl.startsWith('https://')
  }

  return process.env.NODE_ENV === 'production'
}
