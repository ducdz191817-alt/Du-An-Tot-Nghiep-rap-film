# ============================================================
#  Nova Cinema - Cloudflare Tunnel (ON DINH NHAT)
#  Khong bi timeout, URL duoc cap moi lan nhung rat on dinh
#  Chay: PowerShell -> .\start-tunnel.ps1
# ============================================================

$CLOUDFLARED = "$PSScriptRoot\cloudflared.exe"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "     NOVA CINEMA - Cloudflare Tunnel      " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

if (-Not (Test-Path $CLOUDFLARED)) {
    Write-Host "Khong tim thay cloudflared.exe. Dang tai..." -ForegroundColor Yellow
    $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
    Invoke-WebRequest -Uri $url -OutFile $CLOUDFLARED -UseBasicParsing
    Write-Host "Tai xong!" -ForegroundColor Green
}

Write-Host "Dang khoi dong Cloudflare Tunnel..." -ForegroundColor Yellow
Write-Host "Doi URL xuat hien trong dong 'trycloudflare.com' bên duoi." -ForegroundColor Yellow
Write-Host "SAO CHEP URL do va cap nhat vao SePay Dashboard." -ForegroundColor Yellow
Write-Host ""
Write-Host "Vi du URL Webhook SePay:" -ForegroundColor Cyan
Write-Host "  https://xxxx-xxxx.trycloudflare.com/api/payments/sepay/webhook" -ForegroundColor Green
Write-Host ""
Write-Host "Nhan Ctrl+C de dung." -ForegroundColor Yellow
Write-Host ""

$retryCount = 0

while ($true) {
    $retryCount++
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Lan thu ${retryCount} - Dang ket noi Cloudflare Tunnel..." -ForegroundColor Green

    & $CLOUDFLARED tunnel --protocol http2 --url http://localhost:5000 2>&1

    Write-Host ""
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Tunnel ngat. Cho 2 giay roi ket noi lai..." -ForegroundColor Red
    Start-Sleep -Seconds 2
}
