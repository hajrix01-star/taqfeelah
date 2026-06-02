# Run once as Administrator: allows inbound TCP 3000 for Next.js dev on LAN
$port = if ($env:PORT) { [int]$env:PORT } else { 3000 }
$ruleName = "Taqfeelah Next dev (port $port)"

$existing = Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Firewall rule already exists: $ruleName"
  exit 0
}

try {
  New-NetFirewallRule `
    -DisplayName $ruleName `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort $port `
    -Profile Private, Domain `
    -ErrorAction Stop
  Write-Host "Added firewall rule: $ruleName"
} catch {
  Write-Host "FAILED: Could not add firewall rule (run PowerShell as Administrator)."
  Write-Host $_.Exception.Message
  exit 1
}
Write-Host "Retry on phone: http://<your-LAN-IP>:$port/prototype-runtime"
