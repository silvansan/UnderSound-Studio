import type { Metadata } from 'next'

/** Public app shell name (header, document title). Product name stays `ablaut`. */
export const APP_STUDIO_NAME = 'ablaut-Studio'

export const APP_PRODUCT_NAME = 'ablaut'

export const APP_PRONUNCIATION = '[ˈap.laʊt]'

/** Use in `export const metadata` — root layout applies `ablaut-Studio | …`. */
export function pageMetadata(title: string, description?: string): Metadata {
  return description ? { description, title } : { title }
}

export function formatEventChannelTitle(eventTitle: string, channelTitle: string): string {
  return `${eventTitle} - ${channelTitle}`
}
