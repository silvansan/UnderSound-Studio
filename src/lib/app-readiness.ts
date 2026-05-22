let payloadReady = false

export function markPayloadReady() {
  payloadReady = true
}

export function isPayloadReady(): boolean {
  return payloadReady
}
