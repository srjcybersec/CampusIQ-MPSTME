# Student Resource Book Text Extraction Setup

## Quick Setup Guide

To run the pre-extraction script, you need to set up your Firebase Admin credentials locally.

### Option 1: Get Credentials from Vercel (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Copy the following variables:
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`

5. Create a `.env.local` file in the project root:
   ```bash
   # Create the file
   touch .env.local
   ```

6. Add the variables to `.env.local`:
   ```env
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
   ```

   **Important**: The `FIREBASE_PRIVATE_KEY` should be on a single line with `\n` characters, exactly as shown in Vercel.

### Option 2: Get Credentials from Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Extract the values:
   - `project_id` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)
   - Storage bucket name → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` (usually `project-id.appspot.com`)

7. Create `.env.local` file with these values

## Running the Script

Once you have `.env.local` set up:

```bash
npx ts-node scripts/extract-srb-text.ts
```

The script will:
- ✅ Extract text from the 124-page PDF
- ✅ Store it in Firestore at `studentResourceBook/text`
- ✅ Take a few minutes (runs locally, no timeout issues)

After completion, the SRB API will automatically use the pre-extracted text for fast responses!

## Troubleshooting

### Error: "Missing Firebase Admin credentials"
- Make sure `.env.local` exists in the project root
- Check that all 4 required variables are set
- Verify the private key includes `\n` characters

### Error: "PDF file not found"
- Make sure the PDF is uploaded to Firebase Storage
- Path should be: `student-resource-book/student-resource-book.pdf`
- Check Firebase Console → Storage

### Error: "Permission denied"
- Make sure your Firebase service account has Storage Admin permissions
- Check Firebase Console → IAM & Admin → Service Accounts

## Alternative: Manual Extraction

If the script doesn't work, you can manually extract and store the text:

1. Use any PDF text extraction tool
2. Copy the extracted text
3. Go to Firebase Console → Firestore
4. Create collection: `studentResourceBook`
5. Create document with ID: `text`
6. Add field: `extractedText` (string) with the extracted text
7. Add field: `extractedAt` (timestamp)
8. Add field: `textLength` (number)

The API will automatically detect and use this pre-extracted text!
