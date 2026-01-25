/**
 * Bulk Upload Script for Previous Year Questions (PYQs)
 * 
 * This script processes the PYQ folder structure and uploads all PDFs to Firebase Storage
 * while creating corresponding Firestore documents.
 * 
 * Usage:
 * 1. Place your PYQs folder in the project root (or update the path below)
 * 2. Ensure your .env file has Firebase credentials
 * 3. Run: npx ts-node --project scripts/tsconfig.json scripts/upload-pyqs.ts
 * 
 * Folder Structure Expected:
 * PYQs/
 *   ├── Branch1.zip
 *   ├── Branch2.zip
 *   └── ...
 * 
 * Each branch zip contains:
 *   ├── Sem V/
 *   │   ├── Subject1/
 *   │   │   ├── file1.pdf
 *   │   │   └── file2.pdf
 *   │   └── Subject2/
 *   │       └── ...
 *   └── Sem 6/
 *       └── ...
 */

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import * as fs from "fs";
import * as path from "path";
import AdmZip from "adm-zip";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { getFirestore } from "firebase-admin/firestore";
import type { PYQDocument, Branch } from "../lib/types/pyqs";

// Initialize Firebase Admin
if (getApps().length === 0) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Try to load from serviceAccountKey.json file if env vars not set
  let serviceAccount: any = null;
  
  if (!projectId || !clientEmail || !privateKey) {
    const serviceAccountPath = path.join(process.cwd(), "serviceAccountKey.json");
    if (fs.existsSync(serviceAccountPath)) {
      try {
        serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
        console.log("✅ Loaded Firebase Admin credentials from serviceAccountKey.json");
      } catch (e: any) {
        console.error("❌ Error reading serviceAccountKey.json:", e.message);
      }
    }
  }

  if (projectId && clientEmail && privateKey) {
    // Use individual environment variables (same as API routes)
    let formattedPrivateKey = privateKey;
    
    // Handle private key formatting
    try {
      const parsed = JSON.parse(privateKey);
      if (typeof parsed === "string") {
        formattedPrivateKey = parsed;
      }
    } catch {
      // Not JSON, use as-is
    }
    
    // Replace escaped newlines
    formattedPrivateKey = formattedPrivateKey.replace(/\\n/g, "\n");
    formattedPrivateKey = formattedPrivateKey.replace(/\\\\n/g, "\n");
    
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log("✅ Initialized Firebase Admin with environment variables");
  } else if (serviceAccount) {
    // Use service account JSON file
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || serviceAccount.project_id,
    });
  } else {
    console.error("❌ Firebase Admin credentials not found!");
    console.error("Please set one of the following:");
    console.error("  1. Environment variables: NEXT_PUBLIC_FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
    console.error("  2. Place serviceAccountKey.json in project root");
    process.exit(1);
  }
}

const storage = getStorage();
const db = getFirestore();

// Configuration
const PYQS_FOLDER_PATH = path.join(process.cwd(), "PYQs");
const STORAGE_BASE_PATH = "pyqs";

// Branch name mapping (update this based on your actual branch folder names)
const BRANCH_MAPPING: Record<string, Branch> = {
  "ARTIFICIAL INTELLIGENCE": "Artificial Intelligence",
  "CIVIL": "Civil",
  "COMPUTER": "Computer",
  "CSBS": "Csbs",
  "CSE CYBER SECURITY": "Cse Cyber Security",
  "DATA SCIENCE": "Data Science",
  "ELECTRICAL": "Electrical",
  "EXTC": "Extc",
  "IT": "Information Technology",
  "MECHANICAL": "Mechanical"
  // Add more mappings as needed
};

// Branch-specific semester folder name mapping with exact names
const BRANCH_SEMESTER_FOLDER_NAMES: Partial<Record<Branch, { "5": string[]; "6": string[] }>> = {
  "Artificial Intelligence": { "5": ["SEM-V"], "6": ["SEM-VI"] },
  "Civil": { "5": ["V SEMESTER"], "6": ["VI SEMESTER"] },
  "Computer": { "5": ["V SEMESTER"], "6": ["VI SEMESTER"] },
  "Csbs": { "5": ["SEM-V"], "6": ["SEM-VI"] },
  "Cse Cyber Security": { "5": ["SEM-V"], "6": ["SEM-VI"] },
  "Data Science": { "5": ["SEM V"], "6": ["SEM VI"] },
  "Electrical": { "5": ["SEM V"], "6": ["SEM VI"] },
  "Extc": { "5": ["V SEMESTER"], "6": ["VI SEMESTER"] },
  "Information Technology": { "5": ["V SEMESTER"], "6": ["VI SEMESTER"] },
  "Mechanical": { "5": ["V SEMESTER"], "6": ["VI SEMESTER"] },
};

/**
 * Extract branch name from zip filename
 */
function getBranchFromFileName(fileName: string): Branch {
  const nameWithoutExt = fileName.replace(/\.zip$/i, "");
  
  // Try exact match first
  if (BRANCH_MAPPING[nameWithoutExt]) {
    return BRANCH_MAPPING[nameWithoutExt];
  }

  // Try case-insensitive match
  for (const [key, value] of Object.entries(BRANCH_MAPPING)) {
    if (key.toLowerCase() === nameWithoutExt.toLowerCase()) {
      return value;
    }
  }

  // Default to "Other" if no match
  console.warn(`⚠️  Unknown branch: ${nameWithoutExt}, using "Other"`);
  return "Other";
}

/**
 * Upload a PDF file to Firebase Storage
 */
async function uploadPDFToStorage(
  filePath: string,
  storagePath: string
): Promise<string> {
  const bucket = storage.bucket();
  const file = bucket.file(storagePath);

  await bucket.upload(filePath, {
    destination: storagePath,
    metadata: {
      contentType: "application/pdf",
    },
  });

  // Make file publicly accessible
  await file.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
  return publicUrl;
}

/**
 * Process a single PDF file
 */
async function processPDF(
  pdfPath: string,
  branch: Branch,
  semester: "5" | "6",
  subject: string,
  fileName: string
): Promise<void> {
  const stats = fs.statSync(pdfPath);
  const fileSize = stats.size;

  // Create storage path: pyqs/{branch}/{semester}/{subject}/{fileName}
  const storagePath = `${STORAGE_BASE_PATH}/${branch}/${semester}/${subject}/${fileName}`;

  console.log(`📄 Uploading: ${branch} > Sem ${semester} > ${subject} > ${fileName}`);

  try {
    // Upload to Firebase Storage
    const fileUrl = await uploadPDFToStorage(pdfPath, storagePath);

    // Create Firestore document
    const pyqData: Omit<PYQDocument, "id" | "downloadCount"> = {
      branch,
      semester,
      subject,
      fileName,
      fileUrl,
      storagePath,
      fileSize,
      uploadedAt: new Date(),
    };

    await db.collection("pyqs").add({
      ...pyqData,
      uploadedAt: new Date(),
      downloadCount: 0,
    });

    console.log(`✅ Uploaded: ${fileName}`);
  } catch (error) {
    console.error(`❌ Error uploading ${fileName}:`, error);
    throw error;
  }
}

/**
 * Process a subject folder
 */
async function processSubjectFolder(
  subjectPath: string,
  branch: Branch,
  semester: "5" | "6",
  subjectName: string
): Promise<void> {
  const files = fs.readdirSync(subjectPath);

  for (const file of files) {
    const filePath = path.join(subjectPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile() && file.toLowerCase().endsWith(".pdf")) {
      await processPDF(filePath, branch, semester, subjectName, file);
    }
  }
}

/**
 * Find semester folder with flexible naming
 */
function findSemesterFolder(basePath: string, semester: "5" | "6", branch?: Branch): string | null {
  const entries = fs.readdirSync(basePath, { withFileTypes: true });
  
  // Get patterns - use branch-specific if available, otherwise use common patterns
  let patterns: string[];
  if (branch && BRANCH_SEMESTER_FOLDER_NAMES[branch]) {
    patterns = BRANCH_SEMESTER_FOLDER_NAMES[branch][semester];
  } else {
    // Common variations for semester folder names
    patterns = semester === "5" 
      ? [
          "Sem V", "Sem-V", "SemV", "Sem 5", "Sem-5", "Sem5",
          "SEM V", "SEM-V", "SEMV", "SEM 5", "SEM-5", "SEM5",
          "sem v", "sem-v", "semv", "sem 5", "sem-5", "sem5",
          "V", "5"
        ]
      : [
          "Sem 6", "Sem-6", "Sem6", "Sem VI", "Sem-VI", "SemVI",
          "SEM 6", "SEM-6", "SEM6", "SEM VI", "SEM-VI", "SEMVI",
          "sem 6", "sem-6", "sem6", "sem vi", "sem-vi", "semvi",
          "VI", "6"
        ];
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const folderName = entry.name;
      // Check for exact match or case-insensitive match
      for (const pattern of patterns) {
        if (folderName === pattern || folderName.toLowerCase() === pattern.toLowerCase()) {
          return path.join(basePath, folderName);
        }
      }
      // Also check if folder name contains the pattern
      for (const pattern of patterns) {
        if (folderName.toLowerCase().includes(pattern.toLowerCase())) {
          return path.join(basePath, folderName);
        }
      }
    }
  }
  
  return null;
}

/**
 * Process a semester folder (Sem V or Sem 6)
 */
async function processSemesterFolder(
  semPath: string,
  branch: Branch,
  semester: "5" | "6"
): Promise<void> {
  const entries = fs.readdirSync(semPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subjectName = entry.name;
      const subjectPath = path.join(semPath, entry.name);
      await processSubjectFolder(subjectPath, branch, semester, subjectName);
    }
  }
}

/**
 * Process a branch zip file
 */
async function processBranchZip(zipPath: string): Promise<void> {
  const zipFileName = path.basename(zipPath);
  const branch = getBranchFromFileName(zipFileName);

  console.log(`\n📦 Processing branch: ${branch} (${zipFileName})`);

  // Extract zip to temporary directory
  const tempDir = path.join(process.cwd(), "temp_pyq_extract", branch);
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  try {
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(tempDir, true);

    // Find and process Sem V folder (flexible naming)
    const sem5Path = findSemesterFolder(tempDir, "5", branch);
    if (sem5Path) {
      console.log(`  📚 Processing Sem V (found: ${path.basename(sem5Path)})...`);
      await processSemesterFolder(sem5Path, branch, "5");
    } else {
      // List available folders for debugging
      const availableFolders = fs.readdirSync(tempDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);
      console.warn(`  ⚠️  Sem V folder not found in ${zipFileName}`);
      console.warn(`      Available folders: ${availableFolders.join(", ")}`);
    }

    // Find and process Sem 6 folder (flexible naming)
    const sem6Path = findSemesterFolder(tempDir, "6", branch);
    if (sem6Path) {
      console.log(`  📚 Processing Sem 6 (found: ${path.basename(sem6Path)})...`);
      await processSemesterFolder(sem6Path, branch, "6");
    } else {
      // List available folders for debugging
      const availableFolders = fs.readdirSync(tempDir, { withFileTypes: true })
        .filter(e => e.isDirectory())
        .map(e => e.name);
      console.warn(`  ⚠️  Sem 6 folder not found in ${zipFileName}`);
      console.warn(`      Available folders: ${availableFolders.join(", ")}`);
    }
  } finally {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log("🚀 Starting PYQ bulk upload...\n");

  // Check if PYQs folder exists
  if (!fs.existsSync(PYQS_FOLDER_PATH)) {
    console.error(`❌ PYQs folder not found at: ${PYQS_FOLDER_PATH}`);
    console.log("Please place your PYQs folder in the project root.");
    process.exit(1);
  }

  // Get all zip files in PYQs folder
  const files = fs.readdirSync(PYQS_FOLDER_PATH);
  const zipFiles = files.filter((file) => file.toLowerCase().endsWith(".zip"));

  if (zipFiles.length === 0) {
    console.error(`❌ No zip files found in: ${PYQS_FOLDER_PATH}`);
    process.exit(1);
  }

  console.log(`Found ${zipFiles.length} branch zip files\n`);

  // Process each zip file
  let successCount = 0;
  let errorCount = 0;

  for (const zipFile of zipFiles) {
    try {
      const zipPath = path.join(PYQS_FOLDER_PATH, zipFile);
      await processBranchZip(zipPath);
      successCount++;
    } catch (error) {
      console.error(`❌ Error processing ${zipFile}:`, error);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 Upload Summary:");
  console.log(`✅ Successfully processed: ${successCount} branches`);
  console.log(`❌ Errors: ${errorCount} branches`);
  console.log("=".repeat(50));
}

// Run the script
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
