# ?? Git Workflow - Single Branch + Upstream Fork

**Your Setup**: Keep only `main` branch, sync with upstream fork from `alanalf23-sys`

---

## ?? Your Git Structure (After Cleanup)

```
???????????????????????????????????????????
?  YOUR LOCAL REPOSITORY                  ?
?  I:\ashesinthedawn                      ?
?                                         ?
?  Branch: main ?                         ?
???????????????????????????????????????????
           ?                    ?
           ?                    ?
           ?                    ?
????????????????????????  ????????????????????????
?  ORIGIN (Your Fork)  ?  ?  UPSTREAM (Original) ?
?  Raiff1982/          ?  ?  alanalf23-sys/      ?
?  ashesinthedawn      ?  ?  ashesinthedawn      ?
?                      ?  ?                      ?
?  Branch: main        ?  ?  Branch: main        ?
????????????????????????  ????????????????????????
```

---

## ?? Quick Start - Clean Up Now

```powershell
# Run the cleanup script
.\cleanup-branches.ps1

# Type 'YES' to confirm
# Type 'yes' to delete remote branches
```

**What it does**:
- ? Keeps `main` branch (local)
- ? Keeps `origin/main` (your GitHub fork)
- ? Keeps `upstream/main` (alanalf23-sys fork)
- ? Deletes all other local branches
- ? Deletes all other remote branches on your fork
- ? Preserves all upstream branches (read-only)

---

## ?? Daily Workflow

### 1. Start Your Day - Sync with Upstream

```bash
# Fetch latest changes from upstream (alanalf23-sys)
git fetch upstream

# Merge upstream changes into your main branch
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

### 2. Make Changes

```bash
# Work directly on main branch
# Edit files as needed

# Stage changes
git add .

# Commit
git commit -m "Description of your changes"

# Push to your fork
git push origin main
```

### 3. Keep in Sync (Periodic)

```bash
# Every few days, sync with upstream
git fetch upstream
git rebase upstream/main
git push origin main --force-with-lease
```

---

## ?? Common Commands

### Check Status

```bash
# See current branch
git branch --show-current
# Should output: main

# See all branches
git branch -a
# Should show:
#   * main
#   remotes/origin/main
#   remotes/upstream/main
#   remotes/upstream/... (other upstream branches)

# Check remotes
git remote -v
# Should show:
#   origin    https://github.com/Raiff1982/ashesinthedawn
#   upstream  https://github.com/alanalf23-sys/ashesinthedawn
```

### Sync with Upstream (Full Process)

```bash
# Method 1: Merge (preserves history)
git fetch upstream
git checkout main
git merge upstream/main
git push origin main

# Method 2: Rebase (clean history)
git fetch upstream
git checkout main
git rebase upstream/main
git push origin main --force-with-lease
```

### Pull Changes from Your Fork

```bash
# Pull your own changes from GitHub
git pull origin main
```

### Push Changes to Your Fork

```bash
# Push committed changes
git push origin main

# Force push (after rebase)
git push origin main --force-with-lease
```

---

## ?? What NOT to Do

### ? Don't Create Other Branches

```bash
# BAD - Don't do this
git checkout -b feature-branch

# GOOD - Work directly on main
git checkout main
# Make changes directly
```

### ? Don't Push to Upstream

```bash
# BAD - You can't push here (read-only)
git push upstream main

# GOOD - Only push to your fork
git push origin main
```

### ? Don't Delete Main Branch

```bash
# BAD - Never delete main
git branch -d main

# GOOD - Always keep main
git checkout main
```

---

## ?? Troubleshooting

### Issue: "Your branch has diverged from 'origin/main'"

**Solution**:
```bash
# Check what's different
git status

# If you want to keep your changes
git push origin main --force-with-lease

# If you want to discard local changes
git reset --hard origin/main
```

### Issue: "Merge conflict with upstream"

**Solution**:
```bash
# After conflict during merge/rebase
# 1. Fix conflicts in files (VS Code shows them clearly)
# 2. Stage resolved files
git add .

# 3. Complete the merge/rebase
git merge --continue
# or
git rebase --continue

# 4. Push
git push origin main
```

### Issue: "Can't find upstream"

**Solution**:
```bash
# Check remotes
git remote -v

# Add upstream if missing
git remote add upstream https://github.com/alanalf23-sys/ashesinthedawn.git

# Verify
git remote -v
```

### Issue: "Local branches still exist after cleanup"

**Solution**:
```bash
# Force delete stubborn branches
git branch -D branch-name

# Clean up remote tracking
git remote prune origin
git remote prune upstream
```

---

## ?? Understanding Your Setup

### What is `origin`?

- **Your fork** on GitHub: `Raiff1982/ashesinthedawn`
- You have **full control** (read/write)
- Push your changes here
- This is your "backup" on GitHub

### What is `upstream`?

- **Original repository**: `alanalf23-sys/ashesinthedawn`
- You have **read-only access**
- Fetch updates from here
- Don't try to push here

### Why Only One Branch?

- **Simplicity**: No confusion about which branch to work on
- **Clean history**: Easy to sync with upstream
- **Less maintenance**: No stale branches to manage
- **Direct workflow**: Make changes ? commit ? push

---

## ?? Advanced: Keeping Fork Updated Automatically

### Set Up Automatic Sync (GitHub)

1. Go to: https://github.com/Raiff1982/ashesinthedawn
2. Click "Sync fork" button (if available)
3. Or enable GitHub Actions to auto-sync

### Manual Sync Schedule

```bash
# Run this once a week
git fetch upstream
git checkout main
git rebase upstream/main
git push origin main --force-with-lease
```

---

## ?? After Security Cleanup

Since you just cleaned up the Kaggle credentials:

1. **Verify remotes are clean**:
   ```bash
   git remote -v
   # Should show only origin and upstream
   ```

2. **Verify main branch is clean**:
   ```bash
   git log --oneline -10
   # Check recent commits
   ```

3. **Verify no leaked credentials**:
   ```bash
   .\scan-secrets.ps1
   # Should report: 0 findings
   ```

---

## ?? Quick Reference Card

| Task | Command |
|------|---------|
| Check current branch | `git branch --show-current` |
| Switch to main | `git checkout main` |
| Sync with upstream | `git fetch upstream && git merge upstream/main` |
| Push to your fork | `git push origin main` |
| Pull from your fork | `git pull origin main` |
| See all branches | `git branch -a` |
| Delete local branch | `git branch -D branch-name` |
| Delete remote branch | `git push origin --delete branch-name` |
| Clean up tracking | `git remote prune origin` |

---

## ? Post-Cleanup Checklist

After running `cleanup-branches.ps1`:

- [ ] Verify only `main` branch exists locally: `git branch`
- [ ] Verify only `origin/main` exists on your fork: `git branch -r | grep origin`
- [ ] Verify upstream connection: `git remote -v`
- [ ] Test sync: `git fetch upstream`
- [ ] Test push: `git push origin main`

---

## ?? Need Help?

### Check Branch Status
```bash
.\cleanup-branches.ps1
# Shows current state and guides you through cleanup
```

### Verify Everything
```bash
# Check branches
git branch -a

# Check remotes
git remote -v

# Check status
git status
```

### Start Fresh (Nuclear Option)
```bash
# If everything is messed up, re-clone
cd I:\
git clone https://github.com/Raiff1982/ashesinthedawn.git ashesinthedawn-fresh
cd ashesinthedawn-fresh
git remote add upstream https://github.com/alanalf23-sys/ashesinthedawn.git
```

---

**Next Step**: Run `.\cleanup-branches.ps1` to clean up your branches now! ??
