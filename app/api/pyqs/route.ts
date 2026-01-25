import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { PYQFilter, Branch, Semester, PYQDocument } from "@/lib/types/pyqs";

// Lazy initialization of Firebase Admin
let adminDb: Firestore | null = null;

function getAdminDb(): Firestore | null {
  if (adminDb) {
    return adminDb;
  }

  try {
    if (!getApps().length) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;

      if (projectId && clientEmail && privateKey) {
        // Handle private key formatting
        let formattedPrivateKey = privateKey;
        
        // Try to parse as JSON first
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
        });
        adminDb = getFirestore();
        return adminDb;
      } else {
        console.warn("Firebase Admin credentials not found.");
        return null;
      }
    } else {
      adminDb = getFirestore();
      return adminDb;
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    return null;
  }
}

// Server-side functions using Admin SDK
async function getPYQDocumentsAdmin(filters: PYQFilter = {}): Promise<PYQDocument[]> {
  const db = getAdminDb();
  if (!db) {
    throw new Error("Firebase Admin not initialized");
  }

  // Fetch all documents (or with minimal filters) to avoid composite index requirements
  // We'll do filtering and sorting client-side
  let query: FirebaseFirestore.Query = db.collection("pyqs");

  // Only apply one filter at a time to avoid composite index requirements
  // If multiple filters are needed, we'll filter client-side
  if (filters.branch && !filters.semester && !filters.subject) {
    query = query.where("branch", "==", filters.branch);
  } else if (filters.semester && !filters.branch && !filters.subject) {
    query = query.where("semester", "==", filters.semester);
  } else if (filters.subject && !filters.branch && !filters.semester) {
    query = query.where("subject", "==", filters.subject);
  }
  // If multiple filters, fetch all and filter client-side

  // Limit to reasonable number
  query = query.limit(5000);

  const snapshot = await query.get();
  const pyqs: PYQDocument[] = [];

  snapshot.forEach((doc) => {
    const data = doc.data();
    pyqs.push({
      id: doc.id,
      branch: data.branch as Branch,
      semester: data.semester as Semester,
      subject: data.subject as string,
      fileName: data.fileName as string,
      fileUrl: data.fileUrl as string,
      storagePath: data.storagePath as string,
      fileSize: data.fileSize as number,
      uploadedAt: data.uploadedAt?.toDate() || new Date(),
      downloadCount: data.downloadCount || 0,
    });
  });

  // Apply client-side filters
  let filtered = pyqs;

  if (filters.branch) {
    filtered = filtered.filter((pyq) => pyq.branch === filters.branch);
  }
  if (filters.semester) {
    filtered = filtered.filter((pyq) => pyq.semester === filters.semester);
  }
  if (filters.subject) {
    filtered = filtered.filter((pyq) => pyq.subject === filters.subject);
  }

  // Apply client-side search filter if provided
  if (filters.searchQuery) {
    const queryLower = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (pyq) =>
        pyq.subject.toLowerCase().includes(queryLower) ||
        pyq.fileName.toLowerCase().includes(queryLower) ||
        pyq.branch.toLowerCase().includes(queryLower)
    );
  }

  // Sort client-side: branch, semester, then subject
  filtered.sort((a, b) => {
    if (a.branch !== b.branch) {
      return a.branch.localeCompare(b.branch);
    }
    if (a.semester !== b.semester) {
      return a.semester.localeCompare(b.semester);
    }
    return a.subject.localeCompare(b.subject);
  });

  return filtered;
}

async function getPYQBranchesAdmin(): Promise<Branch[]> {
  const pyqs = await getPYQDocumentsAdmin();
  const branches = new Set<Branch>();
  pyqs.forEach((pyq) => branches.add(pyq.branch));
  return Array.from(branches).sort();
}

async function getPYQSubjectsAdmin(
  branch?: Branch,
  semester?: Semester
): Promise<string[]> {
  const filters: PYQFilter = {};
  if (branch) filters.branch = branch;
  if (semester) filters.semester = semester;

  const pyqs = await getPYQDocumentsAdmin(filters);
  const subjects = new Set<string>();
  pyqs.forEach((pyq) => subjects.add(pyq.subject));
  return Array.from(subjects).sort();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action");

    // Get branches
    if (action === "branches") {
      const branches = await getPYQBranchesAdmin();
      return NextResponse.json({ branches });
    }

    // Get subjects
    if (action === "subjects") {
      const branch = searchParams.get("branch") as Branch | null;
      const semester = searchParams.get("semester") as Semester | null;
      const subjects = await getPYQSubjectsAdmin(branch || undefined, semester || undefined);
      return NextResponse.json({ subjects });
    }

    // Get PYQ documents with filters
    const filters: PYQFilter = {};
    const branch = searchParams.get("branch");
    const semester = searchParams.get("semester");
    const subject = searchParams.get("subject");
    const searchQuery = searchParams.get("search");

    if (branch) filters.branch = branch as Branch;
    if (semester) filters.semester = semester as Semester;
    if (subject) filters.subject = subject;
    if (searchQuery) filters.searchQuery = searchQuery;

    const pyqs = await getPYQDocumentsAdmin(filters);

    return NextResponse.json({
      success: true,
      pyqs,
      count: pyqs.length,
    });
  } catch (error: any) {
    console.error("Error fetching PYQs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch PYQs" },
      { status: 500 }
    );
  }
}
