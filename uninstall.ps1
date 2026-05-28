# LLMStore Uninstaller - Run as Administrator
Write-Host "Uninstalling LLMStore..." -ForegroundColor Yellow
$services = @("LLMStore-Backend", "LLMStore-Ollama", "LLMStore-Frontend")
foreach ($svc in $services) {
    Stop-Service -Name $svc -Force -ErrorAction SilentlyContinue
    nssm remove $svc confirm 2>$null
    Write-Host "Removed service: $svc" -ForegroundColor Green
}
Remove-Item -Path "C:\LLMStore" -Recurse -Force -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "LLMStore*" -ErrorAction SilentlyContinue
Write-Host "LLMStore uninstalled successfully!" -ForegroundColor Green
