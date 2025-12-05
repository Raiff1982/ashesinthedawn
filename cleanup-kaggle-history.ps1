# Remove Kaggle Credentials from Git History
# This script removes KAGGLE_CODETTE_MODEL_GUIDE.md from all Git history

Write-Host "?? Git History Cleanup - Kaggle Credentials Removal" -ForegroundColor Red
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

# Safety check
Write-Host "??  WARNING: This operation will rewrite Git history!" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor Cyan
Write-Host "  • Remove KAGGLE_CODETTE_MODEL_GUIDE.md from all commits" -ForegroundColor White
Write-Host "  • Rewrite Git history on all branches" -ForegroundColor White
Write-Host "  • Require force-push to remote repositories" -ForegroundColor White
Write-Host "  • Break existing clones (collaborators need to re-clone)" -ForegroundColor White
Write-Host ""

# Check if we're in a git repo
if (-not (Test-Path ".git")) {
    Write-Host "? Error: Not in a Git repository!" -ForegroundColor Red
    Write-Host "   Please run this from: I:\ashesinthedawn" -ForegroundColor Yellow
    exit 1
}

Write-Host "?? Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Confirm action
$confirm = Read-Host "Type 'YES' to proceed with history rewrite (or anything else to cancel)"
if ($confirm -ne 'YES') {
    Write-Host ""
    Write-Host "??  Operation cancelled. No changes made." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "?? Starting cleanup process..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Create backup branch
Write-Host "1??  Creating backup branch..." -ForegroundColor Yellow
git branch backup-before-kaggle-cleanup 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ? Backup branch created: backup-before-kaggle-cleanup" -ForegroundColor Green
} else {
    Write-Host "   ??  Backup branch may already exist (continuing anyway)" -ForegroundColor Yellow
}
Write-Host ""

# Step 2: Remove file from working directory (if exists)
Write-Host "2??  Removing file from working directory..." -ForegroundColor Yellow
if (Test-Path "KAGGLE_CODETTE_MODEL_GUIDE.md") {
    Remove-Item "KAGGLE_CODETTE_MODEL_GUIDE.md" -Force
    Write-Host "   ? File removed from working directory" -ForegroundColor Green
} else {
    Write-Host "   ??  File not in working directory" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Remove from Git history
Write-Host "3??  Removing file from Git history (this may take a minute)..." -ForegroundColor Yellow
Write-Host "   Please wait..." -ForegroundColor Gray

$filterCommand = @"
git filter-branch --force --index-filter "git rm --cached --ignore-unmatch KAGGLE_CODETTE_MODEL_GUIDE.md" --prune-empty --tag-name-filter cat -- --all
"@

try {
    Invoke-Expression $filterCommand 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ? File removed from Git history" -ForegroundColor Green
    } else {
        Write-Host "   ??  Filter-branch completed with warnings (may be OK)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ? Error during history rewrite: $_" -ForegroundColor Red
    Write-Host "   You may need to use BFG Repo-Cleaner instead" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Step 4: Clean up refs
Write-Host "4??  Cleaning up Git references..." -ForegroundColor Yellow
git reflog expire --expire=now --all 2>&1 | Out-Null
git gc --prune=now --aggressive 2>&1 | Out-Null
Write-Host "   ? References cleaned" -ForegroundColor Green
Write-Host ""

# Step 5: Verify removal
Write-Host "5??  Verifying removal..." -ForegroundColor Yellow
$historyCheck = git log --all --full-history -- "KAGGLE_CODETTE_MODEL_GUIDE.md" 2>&1

if ([string]::IsNullOrWhiteSpace($historyCheck)) {
    Write-Host "   ? File successfully removed from all history!" -ForegroundColor Green
} else {
    Write-Host "   ??  File may still be in history. Manual verification needed." -ForegroundColor Yellow
}
Write-Host ""

# Step 6: Show remotes
Write-Host "6??  Remote repositories detected:" -ForegroundColor Yellow
$remotes = git remote -v | Where-Object { $_ -like "*fetch*" }
foreach ($remote in $remotes) {
    Write-Host "   • $remote" -ForegroundColor White
}
Write-Host ""

# Step 7: Instructions for force push
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "? LOCAL CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

Write-Host "?? NEXT STEPS - FORCE PUSH TO REMOTES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Run these commands to update remote repositories:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   git push origin --force --all" -ForegroundColor White
Write-Host "   git push origin --force --tags" -ForegroundColor White
Write-Host ""
Write-Host "   git push upstream --force --all" -ForegroundColor White
Write-Host "   git push upstream --force --tags" -ForegroundColor White
Write-Host ""

Write-Host "??  IMPORTANT WARNINGS:" -ForegroundColor Red
Write-Host ""
Write-Host "1. Notify collaborators BEFORE force-pushing" -ForegroundColor Yellow
Write-Host "2. Anyone who cloned the repo will need to re-clone or reset:" -ForegroundColor Yellow
Write-Host "   git fetch origin" -ForegroundColor Gray
Write-Host "   git reset --hard origin/main" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Open pull requests may be broken" -ForegroundColor Yellow
Write-Host "4. GitHub may show 'force-pushed' warnings (this is expected)" -ForegroundColor Yellow
Write-Host ""

Write-Host "?? VERIFICATION:" -ForegroundColor Cyan
Write-Host ""
Write-Host "After force-pushing, verify on GitHub:" -ForegroundColor Yellow
Write-Host "  • Visit: https://github.com/Raiff1982/ashesinthedawn" -ForegroundColor White
Write-Host "  • Search for: KGAT_d932da64588f0548c3635d2f2cccb546" -ForegroundColor White
Write-Host "  • Should return: 0 results" -ForegroundColor White
Write-Host ""

Write-Host "?? BACKUP:" -ForegroundColor Cyan
Write-Host "   A backup branch was created: backup-before-kaggle-cleanup" -ForegroundColor White
Write-Host "   You can delete it later with: git branch -D backup-before-kaggle-cleanup" -ForegroundColor Gray
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "?? Ready to force-push when you are!" -ForegroundColor Green
Write-Host ""

# Prompt for force push
$pushNow = Read-Host "Do you want to force-push to 'origin' now? (yes/no)"
if ($pushNow -eq 'yes') {
    Write-Host ""
    Write-Host "?? Force-pushing to origin..." -ForegroundColor Cyan
    git push origin --force --all
    git push origin --force --tags
    Write-Host ""
    Write-Host "? Force-push to origin complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Don't forget to also push to upstream if needed:" -ForegroundColor Yellow
    Write-Host "   git push upstream --force --all" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "??  Force-push skipped. Run the commands above when ready." -ForegroundColor Yellow
}

Write-Host ""
