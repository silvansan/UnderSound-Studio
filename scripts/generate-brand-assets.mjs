import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const brandDir = path.join(root, 'brand')
const transparentSrc = path.join(brandDir, 'ablaut-Logo-transparent.png')
const logoWithBgSrc = path.join(brandDir, 'ablaut-Logo.png')
const out = path.join(root, 'public')

async function writeTransparentIcon(size, file) {
  const trimmed = await sharp(transparentSrc)
    .trim({ threshold: 12 })
    .toBuffer({ resolveWithObject: true })

  const maxSide = Math.max(trimmed.info.width, trimmed.info.height)
  const contentSize = Math.round(size * 0.88)
  const padding = Math.round((size - contentSize) / 2)

  await sharp(trimmed.data)
    .resize({
      width: contentSize,
      height: contentSize,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: padding,
      bottom: size - contentSize - padding,
      left: padding,
      right: size - contentSize - padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, force: true })
    .toFile(path.join(out, file))
}

async function writeLogoWithBackground(maxWidth, file) {
  await sharp(logoWithBgSrc)
    .resize({
      width: maxWidth,
      height: maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(out, file))
}

function writeIco(pngBuf, file) {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(1, 4)

  const entry = Buffer.alloc(16)
  entry[0] = 32
  entry[1] = 32
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(pngBuf.length, 8)
  entry.writeUInt32LE(22, 12)

  fs.writeFileSync(path.join(out, file), Buffer.concat([header, entry, pngBuf]))
}

for (const src of [transparentSrc, logoWithBgSrc]) {
  if (!fs.existsSync(src)) {
    console.error(`Missing source file: ${src}`)
    process.exit(1)
  }
}

await writeLogoWithBackground(1024, 'ablaut-logo.png')
await writeTransparentIcon(512, 'ablaut-icon.png')

const favicon32 = await sharp(path.join(out, 'ablaut-icon.png')).resize(32, 32).png().toBuffer()

fs.writeFileSync(path.join(out, 'favicon.png'), favicon32)
fs.writeFileSync(path.join(out, 'icon.png'), favicon32)
await sharp(path.join(out, 'ablaut-icon.png')).resize(180, 180).png().toFile(path.join(out, 'apple-icon.png'))
writeIco(favicon32, 'favicon.ico')

// Keep a canonical transparent source name for docs/scripts that reference it.
fs.copyFileSync(transparentSrc, path.join(brandDir, 'ablaut-logo-source.png'))

console.log('Generated ablaut brand assets:')
console.log('  - ablaut-logo.png from', path.basename(logoWithBgSrc))
console.log('  - favicon/icon/apple-icon from', path.basename(transparentSrc))
