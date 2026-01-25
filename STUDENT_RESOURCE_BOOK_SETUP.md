# Student Resource Book Setup Guide

## Issue
The Student Resource Book feature requires a PDF file to be uploaded to Firebase Storage. If you see an error like "Failed to load Student Resource Book", it means the PDF hasn't been uploaded yet.

## Solution: Upload the PDF to Firebase Storage

### Step 1: Prepare Your PDF
- Ensure your Student Resource Book PDF is ready (should be around 124 pages as mentioned)
- The file should be named `student-resource-book.pdf`

### Step 2: Upload to Firebase Storage

#### Option A: Using Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **Get Started** if you haven't set up Storage yet
5. Click on the **Files** tab
6. Click **Upload file**
7. Create a folder named `student-resource-book` (if it doesn't exist)
8. Navigate into the `student-resource-book` folder
9. Upload your PDF file and name it `student-resource-book.pdf`
10. The full path should be: `student-resource-book/student-resource-book.pdf`

#### Option B: Using Firebase CLI

```bash
# Install Firebase CLI if you haven't already
npm install -g firebase-tools

# Login to Firebase
firebase login

# Upload the file
firebase storage:upload path/to/your/student-resource-book.pdf student-resource-book/student-resource-book.pdf
```

### Step 3: Verify Upload

1. Go to Firebase Console > Storage
2. Check that the file exists at: `student-resource-book/student-resource-book.pdf`
3. The file should be visible and accessible

### Step 4: Test the Feature

1. Go to your deployed app
2. Navigate to **Academics** tab
3. Click on **Student Resource Book**
4. Try asking a question like "What are the guidelines for convocation?"
5. The AI should now be able to answer based on the PDF content

## Troubleshooting

### Error: "PDF file not found"
- **Solution**: Make sure the file is uploaded to the exact path: `student-resource-book/student-resource-book.pdf`
- Check Firebase Console > Storage to verify the file exists

### Error: "Failed to extract text from PDF"
- **Solution**: The PDF might be corrupted or image-based. Try:
  1. Re-upload the PDF
  2. Ensure the PDF is not password-protected
  3. If it's a scanned PDF, the OCR process should handle it, but it may take longer

### Error: "Firebase Admin not initialized"
- **Solution**: Check your Vercel environment variables:
  - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

### Error: "Storage bucket not configured"
- **Solution**: Set `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` in your Vercel environment variables
- Format: `your-project-id.appspot.com` (without `gs://` prefix)

## File Size Considerations

- Large PDFs (100+ pages) may take longer to process on first load
- The system caches extracted text for 1 hour to improve performance
- If the PDF is very large (>50MB), consider compressing it

## Security

- The PDF is stored in Firebase Storage with read access for authenticated users
- Only admins can upload/modify the Student Resource Book (configured in `firestore.rules`)
- The extracted text is cached in memory for performance but not stored permanently

## Next Steps

After uploading the PDF:
1. The first request will extract text from the PDF (may take 30-60 seconds)
2. Subsequent requests will use cached text (much faster)
3. The cache expires after 1 hour and will re-extract if needed
