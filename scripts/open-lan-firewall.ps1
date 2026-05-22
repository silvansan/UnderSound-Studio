# Allow ablaut-studio LAN access from phones/tablets on the same Wi-Fi.
# Run in PowerShell *as Administrator*:
#   Set-ExecutionPolicy -Scope Process Bypass -Force
#   .\scripts\open-lan-firewall.ps1

$ErrorActionPreference = 'Stop'

$rules = @(
  @{ Name = 'ablaut-studio TCP 3000 (app)'; Port = 3000; Protocol = 'TCP' },
  @{ Name = 'ablaut-studio TCP 7880 (livekit)'; Port = 7880; Protocol = 'TCP' },
  @{ Name = 'ablaut-studio TCP 7881 (livekit)'; Port = 7881; Protocol = 'TCP' },
  @{ Name = 'ablaut-studio UDP 50000-50100 (livekit rtc)'; Port = '50000-50100'; Protocol = 'UDP' }
)

foreach ($rule in $rules) {
  $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue

  if ($existing) {
    Write-Host "Rule already exists: $($rule.Name)"
    continue
  }

  New-NetFirewallRule `
    -DisplayName $rule.Name `
    -Direction Inbound `
    -Action Allow `
    -Profile Private `
    -Protocol $rule.Protocol `
    -LocalPort $rule.Port | Out-Null

  Write-Host "Added firewall rule: $($rule.Name)"
}

Write-Host ''
Write-Host 'Done. Test from your phone (same Wi-Fi, not guest/mobile data):'
Write-Host '  http://192.168.x.x:3000/api/health'
Write-Host ''
Write-Host 'Run npm run lan:urls to print your PC LAN IP.'
Write-Host ''
Write-Host 'Manual netsh fallback (if New-NetFirewallRule failed):'
Write-Host '  netsh advfirewall firewall add rule name="ablaut-studio TCP 3000 (app)" dir=in action=allow protocol=TCP localport=3000 profile=private'
Write-Host '  netsh advfirewall firewall add rule name="ablaut-studio TCP 7880 (livekit)" dir=in action=allow protocol=TCP localport=7880 profile=private'
Write-Host '  netsh advfirewall firewall add rule name="ablaut-studio TCP 7881 (livekit)" dir=in action=allow protocol=TCP localport=7881 profile=private'
Write-Host '  netsh advfirewall firewall add rule name="ablaut-studio UDP 50000-50100 (livekit rtc)" dir=in action=allow protocol=UDP localport=50000-50100 profile=private'
