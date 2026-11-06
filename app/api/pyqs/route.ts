import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase/admin";
import { PYQFilter, Branch, Semester, PYQDocument } from "@/lib/types/pyqs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getPYQDocumentsAdmin(filters: PYQFilter = {}): Promise<PYQDocument[]> {
  const db = await getAdminDb();

  let query: FirebaseFirestore.Query = db.collection("pyqs");

  if (filters.branch && !filters.semester && !filters.subject) {
    query = query.where("branch", "==", filters.branch);
  } else if (filters.semester && !filters.branch && !filters.subject) {
    query = query.where("semester", "==", filters.semester);
  } else if (filters.subject && !filters.branch && !filters.semester) {
    query = query.where("subject", "==", filters.subject);
  }

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

  let filtered = pyqs;
  if (filters.branch) filtered = filtered.filter((pyq) => pyq.branch === filters.branch);
  if (filters.semester) filtered = filtered.filter((pyq) => pyq.semester === filters.semester);
  if (filters.subject) filtered = filtered.filter((pyq) => pyq.subject === filters.subject);

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (pyq) =>
        pyq.subject.toLowerCase().includes(q) ||
        pyq.fileName.toLowerCase().includes(q) ||
        pyq.branch.toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => {
    if (a.branch !== b.branch) return a.branch.localeCompare(b.branch);
    if (a.semester !== b.semester) return a.semester.localeCompare(b.semester);
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

async function getPYQSubjectsAdmin(branch?: Branch, semester?: Semester): Promise<string[]> {
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

    if (action === "branches") {
      const branches = await getPYQBranchesAdmin();
      return NextResponse.json({ branches });
    }

    if (action === "subjects") {
      const branch = searchParams.get("branch") as Branch | null;
      const semester = searchParams.get("semester") as Semester | null;
      const subjects = await getPYQSubjectsAdmin(branch || undefined, semester || undefined);
      return NextResponse.json({ subjects });
    }

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

    return NextResponse.json({ success: true, pyqs, count: pyqs.length });
  } catch (error: any) {
    console.error("Error fetching PYQs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch PYQs" },
      { status: 500 }
    );
  }
}
