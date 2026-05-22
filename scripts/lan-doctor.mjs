import { execSync } from 'node:child_process'
import { networkInterfaces, platform } from 'node:os'

function detectLanIPv4() {
  const nets = networkInterfaces()

  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) {
        continue
      }

      if (entry.address.startsWith('169.254.')) {
        continue
      }

      return entry.address
    }
  }

  return null
}

function checkWindowsFirewall() {
  if (platform() !== 'win32') {
    return null
  }

  try {
    const script = [
      "$profile = (Get-NetConnectionProfile | Select-Object -First 1).NetworkCategory",
      "$dockerRules = Get-NetFirewallRule -DisplayName 'Docker Desktop Backend' -ErrorAction SilentlyContinue",
      "$dockerProfiles = ($dockerRules | Select-Object -ExpandProperty Profile -Unique) -join ','",
      "$ablautRules = @(Get-NetFirewallRule -DisplayName 'ablaut-studio*' -ErrorAction SilentlyContinue)",
      "Write-Output \"PROFILE=$profile\"",
      "Write-Output \"DOCKER_PROFILES=$dockerProfiles\"",
      "Write-Output \"ABLAUT_RULES=$($ablautRules.Count)\"",
    ].join('; ')

    const output = execSync(`powershell -NoProfile -Command "${script}"`, {
      encoding: 'utf8',
      timeout: 15000,
    })

    const values = Object.fromEntries(
      output
        .trim()
        .split('\n')
        .map((line) => line.trim().split('='))
        .filter((parts) => parts.length === 2),
    )

    return {
      networkCategory: values.PROFILE ?? 'unknown',
      dockerProfiles: values.DOCKER_PROFILES ?? 'unknown',
      ablautRuleCount: Number.parseInt(values.ABLAUT_RULES ?? '0', 10),
    }
  } catch {
    return null
  }
}

async function probe(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })

    return `${response.status} ${response.ok ? 'OK' : 'FAIL'}`
  } catch (error) {
    return error instanceof Error ? error.message : 'failed'
  }
}

const lanIp = detectLanIPv4()
const appPort = process.env.APP_PORT || '3000'

console.log('')
console.log('LAN connectivity doctor')
console.log('=======================')
console.log('')

if (!lanIp) {
  console.log('No LAN IPv4 found. Connect this PC to Wi‑Fi/Ethernet.')
  process.exit(1)
}

console.log(`LAN IP: ${lanIp}`)
console.log('')

const localhostHealth = await probe(`http://127.0.0.1:${appPort}/api/health`)
const lanHealth = await probe(`http://${lanIp}:${appPort}/api/health`)

console.log(`PC  → localhost:${appPort}/api/health     ${localhostHealth}`)
console.log(`PC  → ${lanIp}:${appPort}/api/health  ${lanHealth}`)
console.log('')

if (!localhostHealth.startsWith('200')) {
  console.log('Docker app is not responding on this PC. Run: docker compose ps')
  process.exit(1)
}

if (!lanHealth.startsWith('200')) {
  console.log('LAN IP failed on this PC — unusual Docker/network issue.')
  process.exit(1)
}

console.log('Docker is publishing on 0.0.0.0 (LAN IP works on this PC).')
console.log('')

const firewall = checkWindowsFirewall()

if (firewall) {
  console.log(`Windows network profile: ${firewall.networkCategory}`)
  console.log(`Docker Desktop firewall rules: ${firewall.dockerProfiles || 'none'}`)
  console.log(`ablaut-studio firewall rules: ${firewall.ablautRuleCount}`)
  console.log('')

  const dockerMissingPrivate =
    firewall.networkCategory === 'Private' &&
    !firewall.dockerProfiles.split(',').includes('Private')

  const needsFirewallRules = firewall.ablautRuleCount === 0

  if (dockerMissingPrivate && needsFirewallRules) {
    console.log('LIKELY CAUSE: Windows Firewall is blocking your phone.')
    console.log('  Your Wi‑Fi is Private, but Docker only opens inbound on Public.')
    console.log('  Phones on the same Wi‑Fi cannot reach port 3000 until you allow it.')
    console.log('')
    console.log('FIX (requires Administrator):')
    console.log('  1. Right‑click PowerShell → Run as administrator')
    console.log('  2. cd i:\\DEVprojects\\ablaut-project\\ablaut-studio')
    console.log('  3. Set-ExecutionPolicy -Scope Process Bypass -Force')
    console.log('  4. .\\scripts\\open-lan-firewall.ps1')
    console.log('')
    console.log('Or double‑click: scripts\\open-lan-firewall-admin.bat')
    console.log('')
  } else if (needsFirewallRules) {
    console.log('No ablaut-studio firewall rules found. Run as Administrator:')
    console.log('  .\\scripts\\open-lan-firewall.ps1')
    console.log('')
  }
}

console.log('If your PHONE still cannot open the page after firewall fix:')
console.log('  1. Phone must use the same Wi‑Fi (not mobile data, not guest Wi‑Fi).')
console.log('  2. Router “AP isolation / client isolation” must be OFF.')
console.log('  3. On the phone, open exactly:')
console.log(`       http://${lanIp}:${appPort}/api/health`)
console.log('     You should see JSON with "ok":true.')
console.log('  4. Temporarily disable VPN on PC or phone if still blocked.')
console.log('')
