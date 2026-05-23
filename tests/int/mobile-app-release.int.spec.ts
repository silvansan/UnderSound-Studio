import { describe, expect, it } from 'vitest'

import { getMobileAppDownloadPath } from '@/lib/mobile-app-release'

describe('mobile app release helpers', () => {
  it('uses a first-party download path for footer QR codes', () => {
    expect(getMobileAppDownloadPath()).toBe('/api/public/mobile-app/download')
  })
})
