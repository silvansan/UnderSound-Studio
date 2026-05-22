export function slugifyChannelName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function resolveChannelSlugForCreate(name: string): string {
  const slug = slugifyChannelName(name)

  return slug.length > 0 ? slug : 'channel'
}

export function resolveChannelSlugForUpdate(
  explicitSlug: string | undefined,
  existingSlug: string,
): string {
  if (explicitSlug) {
    const formatted = slugifyChannelName(explicitSlug)

    return formatted.length > 0 ? formatted : existingSlug
  }

  return existingSlug
}

export function resolvePublicLanguageFields(channel: {
  languageCode?: string | null
  languageLabel?: string | null
  name: string
  slug: string
}): { languageCode: string; languageLabel: string } {
  return {
    languageCode: channel.languageCode?.trim() || channel.slug,
    languageLabel: channel.languageLabel?.trim() || channel.name,
  }
}
