import QRCode from 'qrcode'

const defaultOptions = {
  color: {
    dark: '#1a3d2e',
    light: '#ffffff',
  },
  margin: 2,
  width: 512,
}

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, defaultOptions)
}

export async function generateQrBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, defaultOptions)
}
