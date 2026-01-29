# Google Calendar API Setup Guide

## Issue: "This site can't be reached" Error

This error typically occurs when the redirect URI doesn't match what's configured in Google Cloud Console.

## Step-by-Step Fix

### 1. Check Your Redirect URI Configuration

The redirect URI must match EXACTLY what's configured in Google Cloud Console.

**For Local Development:**
```
http://localhost:3000/api/auth/google/callback
```

**For Production (Vercel):**
```
https://your-domain.vercel.app/api/auth/google/callback
```

### 2. Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID
5. Under **Authorized redirect URIs**, add:
   - For local: `http://localhost:3000/api/auth/google/callback`
   - For production: `https://your-domain.vercel.app/api/auth/google/callback`
6. Click **Save**

### 3. Set Environment Variables

**In `.env.local` (for local development):**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**In Vercel Environment Variables (for production):**
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/google/callback
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 4. Important Notes

- **Exact Match Required**: The redirect URI in Google Cloud Console must match EXACTLY (including http/https, port, and path)
- **No Trailing Slash**: Don't add a trailing slash to the redirect URI
- **Test Users**: If your app is in "Testing" mode, add test user emails in Google Cloud Console under OAuth consent screen
- **Publishing**: For production use, you may need to submit your app for verification

### 5. Testing

1. Start your local server: `npm run dev`
2. Go to `/schedule` page
3. Click "Connect Google Calendar"
4. You should be redirected to Google's OAuth consent screen
5. After authorizing, you should be redirected back to `/schedule` with success message

### 6. Troubleshooting

**If you still get "This site can't be reached":**
1. Check browser console for errors
2. Verify redirect URI matches exactly in Google Cloud Console
3. Check server logs for redirect URL being used
4. Ensure environment variables are set correctly
5. Try clearing browser cache and cookies

**Common Issues:**
- Redirect URI mismatch → Check Google Cloud Console
- Missing environment variables → Check `.env.local` and Vercel
- Port mismatch → Ensure using correct port (3000 for local)
- HTTPS vs HTTP → Use https for production, http for local
