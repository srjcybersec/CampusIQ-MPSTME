# Student Resource Book Troubleshooting Guide

## Current Issue
The SRB feature is not working even though:
- ✅ PDF is uploaded to Firebase Storage at correct path
- ✅ Environment variables are set correctly
- ✅ Firestore rules are configured

## How to Check Vercel Logs

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click on **"Deployments"** tab
4. Click on the latest deployment
5. Click on **"Functions"** tab
6. Find `/api/student-resource-book/ask`
7. Click on it to see the logs

Look for errors with `[SRB]` prefix - these are the detailed logs we added.

## Common Issues and Solutions

### Issue 1: Function Timeout
**Symptoms**: Error message about timeout or function execution limit

**Cause**: Vercel has execution time limits:
- Free tier: 10 seconds
- Pro tier: 60 seconds
- Enterprise: 300 seconds

A 124-page PDF extraction might exceed these limits.

**Solutions**:
1. **Pre-extract and cache text** (Recommended):
   - Extract the PDF text once manually or via a script
   - Store the extracted text in Firestore
   - Modify the API to read from Firestore instead of extracting on-the-fly

2. **Upgrade Vercel plan** to Pro or Enterprise for longer timeouts

3. **Optimize PDF extraction**:
   - Extract only first N pages for initial testing
   - Use faster extraction methods
   - Process in chunks

### Issue 2: Firebase Admin Initialization Error
**Symptoms**: "Firebase Admin not initialized" error

**Check**:
- Verify all environment variables are set in Vercel:
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY` (should be the full key with `\n` characters)
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

**Solution**: 
- Make sure `FIREBASE_PRIVATE_KEY` includes the full key with escaped newlines
- In Vercel, the private key should be on a single line with `\n` characters

### Issue 3: PDF Extraction Failing
**Symptoms**: "Failed to extract any meaningful text from PDF"

**Possible Causes**:
1. PDF is password-protected
2. PDF is corrupted
3. PDF contains only images (scanned document)
4. PDF is too large

**Solutions**:
1. Check if PDF opens correctly in a PDF viewer
2. Try extracting text manually using a tool
3. If it's a scanned PDF, ensure OCR is working (tesseract.js)
4. Try with a smaller test PDF first

### Issue 4: Storage Access Denied
**Symptoms**: "Permission denied" or "Access denied" errors

**Check**:
- Verify Firebase Storage rules allow read access for authenticated users
- Check that the file path is correct: `student-resource-book/student-resource-book.pdf`

**Solution**: 
- Review `firestore.rules` - the storage rules should allow read for authenticated users

## Quick Test

To test if the issue is with PDF extraction or something else:

1. **Test with a small PDF** (1-2 pages):
   - Upload a small test PDF
   - See if it works
   - If it works, the issue is likely timeout or PDF size

2. **Check Vercel Function Logs**:
   - Look for `[SRB]` prefixed logs
   - These will show exactly where the process is failing

3. **Test Firebase Storage Access**:
   - Try downloading the PDF manually from Firebase Console
   - Verify the file is accessible

## Recommended Solution: Pre-extract Text

For a 124-page PDF, the best approach is to pre-extract the text and store it in Firestore:

1. Create a script to extract text once
2. Store the extracted text in a Firestore document
3. Modify the API to read from Firestore instead of extracting on each request

This will:
- ✅ Eliminate timeout issues
- ✅ Make responses much faster
- ✅ Reduce server load
- ✅ Improve user experience

Would you like me to create a script to pre-extract and store the PDF text?

## Next Steps

1. Check Vercel logs to see the exact error
2. Share the error message from the logs
3. Based on the error, we can implement the appropriate fix
