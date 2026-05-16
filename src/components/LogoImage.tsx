'use client'

import Image from 'next/image'

const logoSrc = '/undersound-logo.png'

export function LogoImage() {
  return (
    <Image
      src={logoSrc}
      alt="UnderSound logo"
      width={54}
      height={54}
      priority
      unoptimized
      className="h-[54px] w-[54px] object-cover"
    />
  )
}
