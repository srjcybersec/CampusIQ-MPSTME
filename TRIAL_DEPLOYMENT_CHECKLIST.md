# Trial Deployment Checklist for 60+ Users

## 🔴 Critical Security Issues

### 1. Missing Firestore Security Rules for Canteen Orders
**Status:** ❌ **CRITICAL**  
**Location:** `firestore.rules`  
**Issue:** The `canteenOrders` collection has NO security rules defined. This means:
- Any authenticated user can read/write ANY order
- No validation that users can only access their own orders
- Payment data could be exposed

**Fix Required:**
```javascript
// Add to firestore.rules
match /canteenOrders/{orderId} {
  allow read: if request.auth != null && resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
  allow update: if request.auth != null && resource.data.userId == request.auth.uid;
  allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
}
```

### 2. No Authentication Verification in API Routes
**Status:** ❌ **CRITICAL**  
**Location:** Multiple API routes (`app/api/canteen/orders/route.ts`, `app/api/results/route.ts`, etc.)  
**Issue:** API routes accept `userId` as query parameter or body without verifying:
- The user is authenticated
- The userId matches the authenticated user
- This allows users to access/modify other users' data

**Example Vulnerable Code:**
```typescript
// app/api/canteen/orders/route.ts
const userId = searchParams.get("userId"); // ❌ No verification!
```

**Fix Required:** Create authentication middleware:
```typescript
// lib/middleware/auth.ts
export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  // Verify Firebase ID token
  // Return user ID or throw error
}
```

### 3. Missing Rate Limiting
**Status:** ⚠️ **HIGH PRIORITY**  
**Issue:** No rate limiting on API routes, especially:
- Gemini API calls (costly, can be abused)
- File uploads
- Payment endpoints
- Authentication endpoints

**Risk:** Single user could exhaust API quotas or cause DoS

**Fix Required:** Implement rate limiting middleware (e.g., using `@upstash/ratelimit`)

## 🟡 Performance & Scalability Issues

### 4. Client-Side Sorting Instead of Database Indexes
**Status:** ⚠️ **MEDIUM PRIORITY**  
**Location:** `app/api/canteen/orders/route.ts`  
**Issue:** Orders are fetched without `orderBy` and sorted client-side. This works for small datasets but won't scale.

**Current Code:**
```typescript
// Fetches ALL orders, then sorts in memory
orders.sort((a, b) => { ... });
```

**Fix Required:** Create Firestore composite index for `userId + createdAt DESC`

### 5. No Request Timeout Handling
**Status:** ⚠️ **MEDIUM PRIORITY**  
**Location:** Multiple API routes with Gemini calls  
**Issue:** Long-running requests (e.g., PDF extraction, Gemini API calls) have no timeout, causing:
- Vercel function timeouts (10s free, 60s pro)
- Poor user experience
- Resource waste

**Fix Required:** Add timeout handling:
```typescript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error("Request timeout")), 50000)
);
const result = await Promise.race([actualPromise, timeoutPromise]);
```

### 6. Large File Uploads Without Proper Validation
**Status:** ⚠️ **MEDIUM PRIORITY**  
**Location:** `app/api/notes/upload/route.ts`, `app/api/results/upload/route.ts`  
**Issue:** 
- Storage rules limit to 50MB, but no API-level validation
- No file type validation beyond MIME type
- Could cause memory issues on serverless

**Fix Required:** Add validation before processing:
```typescript
if (file.size > 50 * 1024 * 1024) {
  return NextResponse.json({ error: "File too large" }, { status: 400 });
}
```

## 🟢 Code Quality & Monitoring

### 7. Inconsistent Error Handling
**Status:** ⚠️ **LOW PRIORITY**  
**Issue:** Error handling varies across routes:
- Some return generic errors
- Some expose error messages
- No structured error logging

**Fix Required:** Standardize error responses and add structured logging

### 8. No Environment Variable Validation
**Status:** ⚠️ **MEDIUM PRIORITY**  
**Issue:** Missing env vars cause runtime errors instead of startup errors

**Fix Required:** Add validation on app startup:
```typescript
// lib/env.ts
export function validateEnv() {
  const required = ['NEXT_PUBLIC_GEMINI_API_KEY', 'RAZORPAY_KEY_ID', ...];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(', ')}`);
  }
}
```

### 9. Duplicate Firebase Admin Initialization
**Status:** ⚠️ **LOW PRIORITY**  
**Location:** Multiple files (`app/api/pyqs/route.ts`, `app/api/results/route.ts`)  
**Issue:** Some routes have their own `getAdminDb()` instead of using centralized `lib/firebase/admin.ts`

**Fix Required:** Migrate all routes to use centralized admin initialization

### 10. No Monitoring/Logging Infrastructure
**Status:** ⚠️ **MEDIUM PRIORITY**  
**Issue:** Only `console.error` used - no structured logging, no error tracking

**Fix Required:** Integrate error tracking (e.g., Sentry) and structured logging

## 📋 Database Indexes Required

Create these Firestore composite indexes:

1. **canteenOrders:**
   - `userId` (ASC) + `createdAt` (DESC)
   - `status` (ASC) + `createdAt` (DESC)

2. **schedules:**
   - `userId` (ASC) + `day` (ASC) + `startTime` (ASC)

3. **assignments:**
   - `userId` (ASC) + `dueDate` (ASC)

## 🔧 Configuration Checklist

### Environment Variables Required:
- [ ] `NEXT_PUBLIC_GEMINI_API_KEY` - Gemini API key
- [ ] `RAZORPAY_KEY_ID` - Razorpay key ID
- [ ] `RAZORPAY_KEY_SECRET` - Razorpay secret
- [ ] `RAZORPAY_WEBHOOK_SECRET` - Webhook secret
- [ ] `FIREBASE_PROJECT_ID` - Firebase project ID
- [ ] `FIREBASE_CLIENT_EMAIL` - Firebase admin email
- [ ] `FIREBASE_PRIVATE_KEY` - Firebase private key
- [ ] `NEXT_PUBLIC_FIREBASE_*` - Client Firebase config
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- [ ] `MICROSOFT_CLIENT_ID` - Microsoft OAuth client ID
- [ ] `MICROSOFT_CLIENT_SECRET` - Microsoft OAuth secret

### Vercel Configuration:
- [ ] Set all environment variables in Vercel dashboard
- [ ] Configure function timeout (if needed)
- [ ] Set up error tracking (Sentry recommended)
- [ ] Configure custom domain (if needed)

## 🚀 Pre-Deployment Steps

1. **Security:**
   - [ ] Add Firestore rules for `canteenOrders`
   - [ ] Implement authentication middleware
   - [ ] Add rate limiting
   - [ ] Review all API routes for auth checks

2. **Performance:**
   - [ ] Create required Firestore indexes
   - [ ] Add request timeouts
   - [ ] Optimize database queries
   - [ ] Add caching where appropriate

3. **Monitoring:**
   - [ ] Set up error tracking (Sentry)
   - [ ] Add structured logging
   - [ ] Set up alerts for errors
   - [ ] Monitor API usage (Gemini, Razorpay)

4. **Testing:**
   - [ ] Test authentication flow
   - [ ] Test payment flow end-to-end
   - [ ] Test file uploads
   - [ ] Load test with 10-20 concurrent users
   - [ ] Test error scenarios

5. **Documentation:**
   - [ ] Update README with setup instructions
   - [ ] Document API endpoints
   - [ ] Create user guide
   - [ ] Document known limitations

## 📊 Expected Load for 60 Users

- **Concurrent Users:** ~10-15 during peak hours
- **API Calls:** ~100-200 requests/hour
- **Gemini API:** ~50-100 calls/hour (most expensive)
- **Storage:** ~5-10GB (notes, results, PYQs)
- **Database Reads:** ~500-1000 reads/hour
- **Database Writes:** ~100-200 writes/hour

## ⚠️ Known Limitations

1. **Vercel Free Tier Limits:**
   - 10s function timeout (upgrade to Pro for 60s)
   - 100GB bandwidth/month
   - May need Pro plan for 60 users

2. **Gemini API Quotas:**
   - Free tier: 15 RPM, 1M TPM
   - May need to upgrade for production

3. **Firebase Free Tier:**
   - 50K reads/day
   - 20K writes/day
   - Should be sufficient for 60 users

4. **Razorpay:**
   - Test mode available
   - Production requires KYC verification

## 🎯 Priority Order for Fixes

1. **Before Launch (Critical):**
   - Add Firestore rules for canteenOrders
   - Implement authentication middleware
   - Add rate limiting

2. **Before Launch (High Priority):**
   - Add request timeouts
   - Create database indexes
   - Add input validation

3. **Post-Launch (Can Monitor First):**
   - Error tracking setup
   - Performance optimization
   - Code cleanup

---

**Last Updated:** $(date)  
**Review Status:** Ready for implementation
