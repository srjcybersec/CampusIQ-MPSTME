# CampusIQ - Vercel Deployment Guide

## Prerequisites

Before starting, ensure you have:
- ✅ A GitHub account (create at [github.com](https://github.com))
- ✅ A Vercel account (create at [vercel.com](https://vercel.com))
- ✅ All environment variables ready (from your `.env` file)

---

## Step 1: Initialize Git Repository (Local)

### 1.1 Initialize Git
```bash
git init
```

### 1.2 Add all files
```bash
git add .
```

### 1.3 Create initial commit
```bash
git commit -m "Initial commit: CampusIQ - AI-powered academic OS"
```

---

## Step 2: Create GitHub Repository

### 2.1 Create Repository on GitHub
1. Go to [github.com](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `campus-iq-mpstme` (or your preferred name)
4. Description: `AI-powered academic operating system for college students`
5. Choose **Public** or **Private** (Private recommended for hackathon)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click **"Create repository"**

### 2.2 Connect Local Repository to GitHub
After creating the repository, GitHub will show you commands. Use these:

```bash
# Add remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/campus-iq-mpstme.git

# Rename branch to main (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

**Note**: You may be prompted for GitHub credentials. Use a Personal Access Token if 2FA is enabled.

---

## Step 3: Deploy to Vercel

### 3.1 Import Project to Vercel
1. Go to [vercel.com](https://vercel.com) and sign in (use GitHub to sign in for easier integration)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Find and select your `campus-iq-mpstme` repository
5. Click **"Import"**

### 3.2 Configure Project Settings
Vercel will auto-detect Next.js. Verify:
- **Framework Preset**: Next.js
- **Root Directory**: `./` (default)
- **Build Command**: `npm run build` (auto-detected)
- **Output Directory**: `.next` (auto-detected)
- **Install Command**: `npm install` (auto-detected)

### 3.3 Add Environment Variables
**⚠️ CRITICAL STEP - Manual Intervention Required**

Click **"Environment Variables"** and add ALL variables from your `.env` file:

#### Firebase Configuration:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
```

#### Gemini API:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

#### Examination Policy (if you added it):
```
NEXT_PUBLIC_EXAMINATION_POLICY=your_policy_text_here
```

#### Google Calendar OAuth:
```
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=https://your-vercel-app.vercel.app/api/auth/google/callback
```

#### Firebase Admin (for server-side operations):
```
FIREBASE_CLIENT_EMAIL=your_firebase_admin_email_here
FIREBASE_PRIVATE_KEY=your_firebase_private_key_here
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
```

**Important Notes:**
- For `GOOGLE_REDIRECT_URI`, you'll need to update this AFTER deployment with your actual Vercel URL
- For `FIREBASE_PRIVATE_KEY`, paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Make sure to select **"Production"**, **"Preview"**, and **"Development"** for each variable (or just Production if you prefer)

### 3.4 Deploy
1. Click **"Deploy"**
2. Wait for build to complete (usually 2-3 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

---

## Step 4: Post-Deployment Configuration

### 4.1 Update Google OAuth Redirect URI
After deployment, you'll get a Vercel URL. Update:

1. **In Vercel Environment Variables:**
   - Update `GOOGLE_REDIRECT_URI` to: `https://your-actual-vercel-url.vercel.app/api/auth/google/callback`

2. **In Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Navigate to **APIs & Services** → **Credentials**
   - Click on your OAuth 2.0 Client ID
   - Under **Authorized redirect URIs**, add:
     - `https://your-actual-vercel-url.vercel.app/api/auth/google/callback`
   - Click **Save**

### 4.2 Update Firebase Authorized Domains
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Authentication** → **Settings** → **Authorized domains**
4. Add your Vercel domain: `your-project-name.vercel.app`

### 4.3 Test Deployment
1. Visit your Vercel URL
2. Test login functionality
3. Test Gemini API (Examination Policy chat)
4. Test Google Calendar integration (if implemented)

---

## Step 5: Custom Domain (Optional)

If you want a custom domain:

1. In Vercel dashboard, go to your project → **Settings** → **Domains**
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Update `GOOGLE_REDIRECT_URI` and Firebase authorized domains with your custom domain

---

## Troubleshooting

### Build Fails
- Check Vercel build logs for errors
- Ensure all environment variables are set
- Verify `package.json` has all dependencies

### Environment Variables Not Working
- Make sure variables are prefixed with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding new variables
- Check variable names match exactly (case-sensitive)

### Google OAuth Not Working
- Verify redirect URI matches exactly in Google Cloud Console
- Check that redirect URI is added to Vercel environment variables
- Ensure OAuth consent screen is configured

### Firebase Errors
- Verify all Firebase config variables are set
- Check Firebase authorized domains include your Vercel URL
- Ensure Firestore security rules allow your domain

---

## Quick Reference Commands

```bash
# Initialize Git
git init
git add .
git commit -m "Initial commit"

# Connect to GitHub (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/campus-iq-mpstme.git
git branch -M main
git push -u origin main

# Future updates
git add .
git commit -m "Your commit message"
git push
```

---

## Manual Intervention Checklist

- [ ] Create GitHub account (if you don't have one)
- [ ] Create GitHub repository
- [ ] Push code to GitHub (may need to authenticate)
- [ ] Create Vercel account (if you don't have one)
- [ ] Import repository to Vercel
- [ ] Add ALL environment variables in Vercel dashboard
- [ ] Update Google OAuth redirect URI after getting Vercel URL
- [ ] Update Firebase authorized domains
- [ ] Test the deployed application

---

## Next Steps After Deployment

1. Share your Vercel URL with team members
2. Set up monitoring (Vercel Analytics)
3. Configure custom domain (if needed)
4. Set up staging environment (optional)
5. Enable automatic deployments from main branch

---

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify all environment variables are set correctly
4. Ensure Google Cloud Console and Firebase settings are updated
