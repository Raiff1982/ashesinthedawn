# Secret Scanner for Markdown Files
# Scans all .md files for potential leaked secrets

Write-Host "?? CoreLogic Studio - Secret Scanner" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Define patterns to detect (excluding placeholders/examples)
$patterns = @{
    "Real JWT Token" = 'eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}'
    "Private Key" = '-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----'
    "GitHub PAT" = 'github_pat_[A-Za-z0-9_]{82}'
    "GitHub Token" = 'ghp_[A-Za-z0-9]{36}'
    "OpenAI API Key" = 'sk-[A-Za-z0-9]{48}'
    "AWS Access Key" = 'AKIA[0-9A-Z]{16}'
    "Stripe Secret Key" = 'sk_live_[A-Za-z0-9]{24,}'
    "Slack Token" = 'xox[baprs]-[A-Za-z0-9-]+'
    "SendGrid API Key" = 'SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}'
    "Twilio Account SID" = 'AC[a-z0-9]{32}'
    "Supabase Service Key (Real)" = 'eyJ[A-Za-z0-9_-]{100,}\.[A-Za-z0-9_-]{100,}\.[A-Za-z0-9_-]{43,}'
}

# Placeholder patterns to exclude (these are safe examples)
$excludePatterns = @(
    'your-project\.supabase\.co',
    'your_very_secure_jwt_secret_here',
    'your_s3_access_key',
    'your_datadog_api_key',
    'your-sentry-key@sentry\.io',
    'SG\.xxx',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.\.\.',
    'PLACEHOLDER',
    'example\.com',
    'yourdomain\.com',
    'password@db'
)

# Get all markdown files (excluding node_modules and archived folders)
Write-Host "?? Scanning workspace for markdown files..." -ForegroundColor Yellow
$mdFiles = Get-ChildItem -Recurse -Filter "*.md" -File | Where-Object { 
    $_.FullName -notlike "*\node_modules\*" -and 
    $_.FullName -notlike "*\ashesinthedawn-main\*" -and
    $_.FullName -notlike "*\.git\*"
}

Write-Host "   Found $($mdFiles.Count) markdown files" -ForegroundColor Gray
Write-Host ""

# Scan files
$findings = @()
$filesScanned = 0

foreach ($file in $mdFiles) {
    $filesScanned++
    if ($filesScanned % 100 -eq 0) {
        Write-Host "   Progress: $filesScanned / $($mdFiles.Count) files scanned..." -ForegroundColor Gray
    }
    
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $content) { continue }
    
    # Check if content contains placeholder patterns (skip if it's just examples)
    $isExample = $false
    foreach ($excludePattern in $excludePatterns) {
        if ($content -match $excludePattern) {
            $isExample = $true
            break
        }
    }
    
    # Skip files that are clearly example/template files
    if ($file.Name -like "*EXAMPLE*" -or $file.Name -like "*TEMPLATE*" -or $file.Name -like "*PRODUCTION_ENVIRONMENTS*") {
        continue
    }
    
    # Scan for each pattern
    foreach ($patternName in $patterns.Keys) {
        $pattern = $patterns[$patternName]
        $matches = [regex]::Matches($content, $pattern)
        
        foreach ($match in $matches) {
            # Additional validation: ensure it's not a placeholder
            $matchValue = $match.Value
            $isPlaceholder = $false
            
            # Check if match contains placeholder indicators
            if ($matchValue -match '(your|example|placeholder|xxx|\.\.\.|\*\*\*)' -or $matchValue.Length -lt 20) {
                $isPlaceholder = $true
            }
            
            # For JWT tokens, check if it's the standard placeholder
            if ($patternName -match "JWT" -and $matchValue -match 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9') {
                $isPlaceholder = $true
            }
            
            if (-not $isPlaceholder) {
                # Find line number
                $lineNumber = ($content.Substring(0, $match.Index) -split "`n").Count
                
                $findings += [PSCustomObject]@{
                    File = $file.FullName.Replace("$PWD\", "")
                    Type = $patternName
                    Line = $lineNumber
                    Preview = $matchValue.Substring(0, [Math]::Min(50, $matchValue.Length)) + "..."
                }
            }
        }
    }
}

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Gray
Write-Host ""

# Report findings
if ($findings.Count -gt 0) {
    Write-Host "??  WARNING: Found $($findings.Count) potential secret(s)!" -ForegroundColor Red
    Write-Host ""
    $findings | Format-Table -AutoSize -Wrap
    Write-Host ""
    Write-Host "?? RECOMMENDED ACTIONS:" -ForegroundColor Yellow
    Write-Host "   1. Review each finding to confirm if it's a real secret" -ForegroundColor Gray
    Write-Host "   2. If real secrets found:" -ForegroundColor Gray
    Write-Host "      - Rotate/revoke the exposed credentials immediately" -ForegroundColor Gray
    Write-Host "      - Remove secrets from files and use .env instead" -ForegroundColor Gray
    Write-Host "      - Add files to .gitignore if needed" -ForegroundColor Gray
    Write-Host "      - Use 'git filter-branch' or 'BFG Repo-Cleaner' to remove from history" -ForegroundColor Gray
    Write-Host ""
    
    # Save report
    $reportPath = "secret-scan-results.txt"
    $findings | Out-File $reportPath
    Write-Host "?? Full report saved to: $reportPath" -ForegroundColor Cyan
} else {
    Write-Host "? SUCCESS: No secrets detected in markdown files!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Scanned: $filesScanned files" -ForegroundColor Gray
    Write-Host "   Patterns checked: $($patterns.Count) types" -ForegroundColor Gray
    Write-Host ""
    Write-Host "?? Your documentation appears to be secure." -ForegroundColor Green
}

Write-Host ""
