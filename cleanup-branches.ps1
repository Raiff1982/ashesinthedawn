# Clean Up Git Branches - Keep Only Main Branch
# Maintains connection to upstream fork (alanalf23-sys)

Write-Host "?? Git Branch Cleanup Script" -ForegroundColor Cyan
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

# Safety check
if (-not (Test-Path ".git")) {
    Write-Host "? Error: Not in a Git repository!" -ForegroundColor Red
    exit 1
}

Write-Host "?? Current directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host "?? Current branch: $(git branch --show-current)" -ForegroundColor Cyan
Write-Host ""

# Show current branches
Write-Host "?? Current Branch Status:" -ForegroundColor Yellow
Write-Host ""
Write-Host "LOCAL BRANCHES:" -ForegroundColor Cyan
git branch | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
Write-Host ""

Write-Host "REMOTE BRANCHES (origin):" -ForegroundColor Cyan
git branch -r | Where-Object { $_ -like "*origin/*" } | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
Write-Host ""

Write-Host "REMOTE BRANCHES (upstream):" -ForegroundColor Cyan
git branch -r | Where-Object { $_ -like "*upstream/*" } | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
Write-Host ""

# Confirm action
Write-Host "??  This script will:" -ForegroundColor Yellow
Write-Host "  ? KEEP: main branch (local)" -ForegroundColor Green
Write-Host "  ? KEEP: origin/main (your GitHub fork)" -ForegroundColor Green
Write-Host "  ? KEEP: upstream/main (alanalf23-sys fork)" -ForegroundColor Green
Write-Host "  ? DELETE: All other local branches" -ForegroundColor Red
Write-Host "  ? DELETE: All other remote branches on origin" -ForegroundColor Red
Write-Host "  ? PRESERVE: All upstream branches (read-only)" -ForegroundColor Green
Write-Host ""

$confirm = Read-Host "Type 'YES' to proceed with cleanup (or anything else to cancel)"
if ($confirm -ne 'YES') {
    Write-Host ""
    Write-Host "??  Operation cancelled. No changes made." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "?? Starting cleanup process..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Switch to main branch
Write-Host "1??  Ensuring we're on main branch..." -ForegroundColor Yellow
$currentBranch = git branch --show-current
if ($currentBranch -ne "main") {
    git checkout main 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ? Switched to main branch" -ForegroundColor Green
    } else {
        Write-Host "   ? Failed to switch to main branch" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "   ? Already on main branch" -ForegroundColor Green
}
Write-Host ""

# Step 2: Delete local branches (except main)
Write-Host "2??  Deleting local branches (except main)..." -ForegroundColor Yellow
$localBranches = git branch | Where-Object { $_ -notmatch "\*" -and $_ -notmatch "main" } | ForEach-Object { $_.Trim() }

if ($localBranches.Count -gt 0) {
    foreach ($branch in $localBranches) {
        Write-Host "   Deleting: $branch" -ForegroundColor Gray
        git branch -D $branch 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "     ? Deleted" -ForegroundColor Green
        } else {
            Write-Host "     ??  Could not delete (may have uncommitted changes)" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "   ??  No local branches to delete" -ForegroundColor Gray
}
Write-Host ""

# Step 3: Delete remote branches on origin (except main)
Write-Host "3??  Deleting remote branches on origin (except main)..." -ForegroundColor Yellow
$remoteBranches = git branch -r | Where-Object { 
    $_ -like "*origin/*" -and 
    $_ -notlike "*origin/main*" -and 
    $_ -notlike "*origin/HEAD*" 
} | ForEach-Object { 
    $_.Trim().Replace("origin/", "") 
}

if ($remoteBranches.Count -gt 0) {
    Write-Host "   Found $($remoteBranches.Count) remote branches to delete" -ForegroundColor Cyan
    Write-Host ""
    $confirmRemote = Read-Host "   Delete these remote branches on GitHub? (yes/no)"
    
    if ($confirmRemote -eq 'yes') {
        foreach ($branch in $remoteBranches) {
            Write-Host "   Deleting remote: origin/$branch" -ForegroundColor Gray
            git push origin --delete $branch 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "     ? Deleted from GitHub" -ForegroundColor Green
            } else {
                Write-Host "     ??  Could not delete" -ForegroundColor Yellow
            }
        }
    } else {
        Write-Host "   ??  Skipped remote branch deletion" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ??  No remote branches to delete" -ForegroundColor Gray
}
Write-Host ""

# Step 4: Verify remotes
Write-Host "4??  Verifying remote connections..." -ForegroundColor Yellow
Write-Host ""
Write-Host "   ORIGIN (your fork):" -ForegroundColor Cyan
git remote get-url origin | ForEach-Object { Write-Host "     $_" -ForegroundColor White }
Write-Host ""
Write-Host "   UPSTREAM (alanalf23-sys fork):" -ForegroundColor Cyan
git remote get-url upstream | ForEach-Object { Write-Host "     $_" -ForegroundColor White }
Write-Host ""

# Step 5: Clean up remote tracking branches
Write-Host "5??  Cleaning up remote tracking branches..." -ForegroundColor Yellow
git remote prune origin 2>&1 | Out-Null
git remote prune upstream 2>&1 | Out-Null
Write-Host "   ? Remote tracking branches cleaned" -ForegroundColor Green
Write-Host ""

# Step 6: Final verification
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "? CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "=" * 70 -ForegroundColor Gray
Write-Host ""

Write-Host "?? FINAL STATUS:" -ForegroundColor Cyan
Write-Host ""

Write-Host "LOCAL BRANCHES:" -ForegroundColor Yellow
git branch | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
Write-Host ""

Write-Host "REMOTE BRANCHES (origin):" -ForegroundColor Yellow
git branch -r | Where-Object { $_ -like "*origin/*" } | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
Write-Host ""

Write-Host "REMOTE BRANCHES (upstream):" -ForegroundColor Yellow
git branch -r | Where-Object { $_ -like "*upstream/*" } | ForEach-Object { Write-Host "  $_" -ForegroundColor Green }
Write-Host ""

Write-Host "?? WHAT'S LEFT:" -ForegroundColor Cyan
Write-Host "  ? main branch (local)" -ForegroundColor Green
Write-Host "  ? origin/main (your GitHub fork: Raiff1982/ashesinthedawn)" -ForegroundColor Green
Write-Host "  ? upstream/main (original fork: alanalf23-sys/ashesinthedawn)" -ForegroundColor Green
Write-Host "  ? upstream remote branches (preserved for syncing)" -ForegroundColor Green
Write-Host ""

Write-Host "?? RECOMMENDED NEXT STEPS:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Sync with upstream:" -ForegroundColor Yellow
Write-Host "   git fetch upstream" -ForegroundColor White
Write-Host "   git merge upstream/main" -ForegroundColor White
Write-Host "   git push origin main" -ForegroundColor White
Write-Host ""
Write-Host "2. Keep your fork updated:" -ForegroundColor Yellow
Write-Host "   # Run periodically to stay in sync" -ForegroundColor Gray
Write-Host "   git fetch upstream" -ForegroundColor White
Write-Host "   git rebase upstream/main" -ForegroundColor White
Write-Host "   git push origin main --force-with-lease" -ForegroundColor White
Write-Host ""

Write-Host "=" * 70 -ForegroundColor Gray
Write-Host "?? Branch cleanup complete!" -ForegroundColor Green
Write-Host ""
