<#
.SYNOPSIS
    Token Rotation Reminder for Hugging Face API Credentials

.DESCRIPTION
    Checks the age of your Hugging Face token and reminds you to rotate it
    Run this script monthly or set up a scheduled task

.EXAMPLE
    .\check-token-rotation.ps1
    
.NOTES
    Recommended: Rotate tokens every 90 days for security
#>

$ErrorActionPreference = "Stop"

# Configuration
$envFilePath = "Codette\.env"
$rotationDays = 90
$warningDays = 14

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "  Token Rotation Security Check" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path $envFilePath)) {
    Write-Host "? ERROR: $envFilePath not found" -ForegroundColor Red
    Write-Host "   Create it from Codette\.env.example" -ForegroundColor Yellow
    exit 1
}

# Check file modification date (approximation of token age)
$fileInfo = Get-Item $envFilePath
$fileAge = (Get-Date) - $fileInfo.LastWriteTime
$daysOld = [math]::Floor($fileAge.TotalDays)

Write-Host "?? Token Information:" -ForegroundColor White
Write-Host "   File: $envFilePath" -ForegroundColor Gray
Write-Host "   Last Modified: $($fileInfo.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host "   Age: $daysOld days" -ForegroundColor Gray
Write-Host ""

# Determine status
if ($daysOld -ge $rotationDays) {
    Write-Host "?? ACTION REQUIRED: Token rotation overdue!" -ForegroundColor Red
    Write-Host "   Your token is $daysOld days old (recommended: $rotationDays days)" -ForegroundColor Red
    Write-Host ""
    Write-Host "   Steps to rotate:" -ForegroundColor Yellow
    Write-Host "   1. Go to: https://huggingface.co/settings/tokens" -ForegroundColor Yellow
    Write-Host "   2. Revoke the old token" -ForegroundColor Yellow
    Write-Host "   3. Create new token (Read permissions, 90-day expiration)" -ForegroundColor Yellow
    Write-Host "   4. Update $envFilePath with new token" -ForegroundColor Yellow
    exit 1
}
elseif ($daysOld -ge ($rotationDays - $warningDays)) {
    $daysRemaining = $rotationDays - $daysOld
    Write-Host "??  WARNING: Token rotation due soon" -ForegroundColor Yellow
    Write-Host "   Rotate your token in $daysRemaining days" -ForegroundColor Yellow
    Write-Host "   Visit: https://huggingface.co/settings/tokens" -ForegroundColor Yellow
    exit 0
}
else {
    $daysRemaining = $rotationDays - $daysOld
    Write-Host "? Token is current" -ForegroundColor Green
    Write-Host "   Next rotation due in $daysRemaining days" -ForegroundColor Green
    Write-Host ""
    Write-Host "?? Tip: Set a calendar reminder for token rotation" -ForegroundColor Cyan
    exit 0
}
