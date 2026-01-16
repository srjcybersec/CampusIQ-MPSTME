# Quick Deployment Steps

## ✅ What's Already Done:
- ✅ Git repository initialized
- ✅ .gitignore configured
- ✅ Project ready for deployment

## 📋 Step-by-Step Instructions:

### STEP 1: Create GitHub Repository (Manual - 5 minutes)

1. **Go to GitHub**: https://github.com
2. **Sign in** (or create account if needed)
3. **Click "+" icon** (top right) → **"New repository"**
4. **Fill in details**:
   - Name: `campus-iq-mpstme` (or your choice)
   - Description: `AI-powered academic operating system for college students`
   - Choose **Private** (recommended) or **Public**
   - **DO NOT** check "Initialize with README" (we already have files)
5. **Click "Create repository"**

### STEP 2: Push Code to GitHub (Run these commands)

Open PowerShell in your project folder and run:

```powershell
# Add all files
git add .

# Create first commit
git commit -m "Initial commit: CampusIQ - AI-powered academic OS"

# Add GitHub remote (REPLACE YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/campus-iq-mpstme.git

# Rename branch to main
git branch -M main

# Push to GitHub
git push -u origin main
```

**Note**: If prompted for credentials:
- Username: Your GitHub username
- Password: Use a **Personal Access Token** (not your password)
  - Create token: GitHub → Settings → Developer settings → Personal access tokens → Generate new token
  - Select scopes: `repo` (full control)
  - Copy token and use it as password

### STEP 3: Deploy to Vercel (Manual - 10 minutes)

1. **Go to Vercel**: https://vercel.com
2. **Sign in** (use "Continue with GitHub" for easy integration)
3. **Click "Add New..."** → **"Project"**
4. **Import your repository**:
   - Find `campus-iq-mpstme` in the list
   - Click **"Import"**
5. **Configure project** (Vercel auto-detects Next.js - just verify):
   - Framework: Next.js ✅
   - Root Directory: `./` ✅
   - Build Command: `npm run build` ✅
   - Output Directory: `.next` ✅
6. **⚠️ CRITICAL: Add Environment Variables**
   - Click **"Environment Variables"**
   - Add ALL variables from your `.env` file (see list below)
   - For each variable, select: **Production**, **Preview**, **Development**
7. **Click "Deploy"**
8. **Wait 2-3 minutes** for build to complete
9. **Your app is live!** 🎉

### STEP 4: Post-Deployment Setup (Manual - 5 minutes)

After deployment, you'll get a URL like: `https://campus-iq-mpstme.vercel.app`

1. **Update Google OAuth Redirect URI**:
   - In Vercel: Go to Settings → Environment Variables
   - Update `GOOGLE_REDIRECT_URI` to: `https://your-actual-url.vercel.app/api/auth/google/callback`
   - In Google Cloud Console: Add the same URL to Authorized redirect URIs
   
2. **Update Firebase Authorized Domains**:
   - Firebase Console → Authentication → Settings → Authorized domains
   - Add: `your-project-name.vercel.app`

3. **Redeploy** (Vercel will auto-redeploy when you update env vars, or click "Redeploy")

---

## 📝 Environment Variables to Add in Vercel:

Copy these from your `.env` file and add them in Vercel dashboard:

### Firebase (6 variables):
```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
```

### Gemini API (1 variable):
```
NEXT_PUBLIC_GEMINI_API_KEY
```

### Examination Policy (1 variable - if you added it):
```
NEXT_PUBLIC_EXAMINATION_POLICY
```

### Google Calendar OAuth (3 variables):
```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI  (Update this AFTER deployment with your Vercel URL)
```

### Firebase Admin (3 variables - if you have them):
```
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY  (Paste entire key including BEGIN/END lines)
NEXT_PUBLIC_FIREBASE_PROJECT_ID  (same as above)
```

---

## ⚠️ Important Notes:

1. **GOOGLE_REDIRECT_URI**: You'll need to update this AFTER deployment with your actual Vercel URL
2. **FIREBASE_PRIVATE_KEY**: Paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
3. **Environment Variables**: Make sure to select all environments (Production, Preview, Development) for each variable
4. **Build Time**: First build takes 2-3 minutes, subsequent builds are faster

---

## 🎯 Quick Checklist:

- [ ] Create GitHub repository
- [ ] Push code to GitHub (run git commands)
- [ ] Create Vercel account
- [ ] Import repository to Vercel
- [ ] Add all environment variables
- [ ] Deploy
- [ ] Update Google OAuth redirect URI
- [ ] Update Firebase authorized domains
- [ ] Test the live app!

---

## 🆘 Need Help?

If something goes wrong:
1. Check Vercel build logs (in Vercel dashboard)
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Make sure Google Cloud Console and Firebase settings are updated

---

## 🚀 After Deployment:

Your app will be live at: `https://your-project-name.vercel.app`

Every time you push to GitHub, Vercel will automatically redeploy! 🎉
