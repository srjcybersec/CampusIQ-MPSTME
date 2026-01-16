# Fixing Git Authentication Issue

## Problem:
You're getting a 403 error because Git is trying to authenticate with the wrong GitHub account (`shivanshjindal28` instead of `srjcybersec`).

## Solution Options:

### Option 1: Use Personal Access Token (Recommended)

1. **Create a Personal Access Token:**
   - Go to: https://github.com/settings/tokens
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - Name: `CampusIQ-Deployment`
   - Expiration: Choose 90 days or custom
   - Select scopes: ✅ **`repo`** (Full control of private repositories)
   - Click **"Generate token"**
   - **COPY THE TOKEN** (you won't see it again!)

2. **Push using the token:**
   ```powershell
   git push -u origin main
   ```
   When prompted:
   - **Username**: `srjcybersec`
   - **Password**: Paste your Personal Access Token (not your GitHub password)

### Option 2: Update Remote URL with Username

Update the remote URL to include your username:

```powershell
git remote set-url origin https://srjcybersec@github.com/srjcybersec/CampusIQ-MPSTME.git
git push -u origin main
```

When prompted, use your Personal Access Token as the password.

### Option 3: Use SSH (Alternative)

If you prefer SSH:

1. Generate SSH key (if you don't have one):
   ```powershell
   ssh-keygen -t ed25519 -C "srjcybersec@gmail.com"
   ```

2. Add SSH key to GitHub:
   - Copy public key: `cat ~/.ssh/id_ed25519.pub`
   - GitHub → Settings → SSH and GPG keys → New SSH key

3. Change remote to SSH:
   ```powershell
   git remote set-url origin git@github.com:srjcybersec/CampusIQ-MPSTME.git
   git push -u origin main
   ```

---

## Quick Fix (Try This First):

Run these commands:

```powershell
# Update remote URL with username
git remote set-url origin https://srjcybersec@github.com/srjcybersec/CampusIQ-MPSTME.git

# Try pushing again (will prompt for credentials)
git push -u origin main
```

**When prompted:**
- Username: `srjcybersec`
- Password: Use a Personal Access Token (create one at https://github.com/settings/tokens)

---

## Verify Repository Access:

Make sure:
1. You're logged into GitHub as `srjcybersec`
2. The repository `CampusIQ-MPSTME` exists and you have write access
3. If it's a different account, you need to be added as a collaborator
