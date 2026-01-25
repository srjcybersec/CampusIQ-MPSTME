# PYQ Bulk Upload Instructions

## Prerequisites

1. Install required dependencies:
```bash
npm install adm-zip @types/adm-zip ts-node
```

2. Ensure your Firebase Admin SDK credentials are set. You can use either:

   **Option A: Environment Variables** (recommended for production)
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Your Firebase project ID
   - `FIREBASE_CLIENT_EMAIL` - Service account client email
   - `FIREBASE_PRIVATE_KEY` - Service account private key
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` - Your Firebase Storage bucket name

   **Option B: Service Account JSON File** (easier for local development)
   - Place `serviceAccountKey.json` in the project root
   - Download from Firebase Console > Project Settings > Service Accounts

## Folder Structure

Place your PYQs folder in the project root with this structure:

```
PYQs/
  ├── Computer Science.zip
  ├── Electronics.zip
  ├── Mechanical.zip
  └── ... (other branch zips)
```

Each branch zip should contain:
```
BranchName.zip
  ├── Sem V/
  │   ├── Subject1/
  │   │   ├── file1.pdf
  │   │   └── file2.pdf
  │   └── Subject2/
  │       └── ...
  └── Sem 6/
      └── ...
```

## Branch Name Mapping

Update the `BRANCH_MAPPING` object in `scripts/upload-pyqs.ts` to match your actual branch folder names:

```typescript
const BRANCH_MAPPING: Record<string, Branch> = {
  "Computer Science": "Computer Science",
  "Electronics": "Electronics",
  // Add all your branch names here
};
```

## Running the Upload Script

1. Place your `PYQs` folder in the project root directory
2. Update branch mappings in `scripts/upload-pyqs.ts` if needed
3. Run the script:

```bash
npx ts-node scripts/upload-pyqs.ts
```

Or add to package.json:
```json
"scripts": {
  "upload-pyqs": "ts-node scripts/upload-pyqs.ts"
}
```

Then run:
```bash
npm run upload-pyqs
```

## What the Script Does

1. Reads all zip files from the `PYQs` folder
2. Extracts each branch zip to a temporary directory
3. Processes `Sem V` and `Sem 6` folders
4. For each subject folder, uploads all PDFs to Firebase Storage
5. Creates Firestore documents with metadata (branch, semester, subject, file info)
6. Tracks download counts (starts at 0)

## Storage Structure

Files are stored in Firebase Storage as:
```
pyqs/
  ├── {Branch}/
  │   ├── 5/
  │   │   ├── {Subject}/
  │   │   │   └── {fileName}.pdf
  │   └── 6/
  │       └── ...
```

## Firestore Structure

Documents are stored in the `pyqs` collection with:
- `branch`: Branch name
- `semester`: "5" or "6"
- `subject`: Subject name
- `fileName`: PDF filename
- `fileUrl`: Public Firebase Storage URL
- `storagePath`: Storage path
- `fileSize`: File size in bytes
- `uploadedAt`: Upload timestamp
- `downloadCount`: Number of downloads (starts at 0)

## Troubleshooting

- **"PYQs folder not found"**: Make sure the `PYQs` folder is in the project root
- **"Unknown branch"**: Update the `BRANCH_MAPPING` in the script
- **"Sem V/Sem 6 folder not found"**: Check that your zip files contain these folders
- **Upload errors**: Check Firebase Admin credentials and Storage bucket configuration
