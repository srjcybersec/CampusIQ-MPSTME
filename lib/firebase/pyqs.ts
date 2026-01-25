import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  updateDoc,
  setDoc,
  increment,
  Timestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { PYQDocument, PYQFilter, Branch, Semester } from "@/lib/types/pyqs";

const PYQS_COLLECTION = "pyqs";

/**
 * Save a PYQ document to Firestore
 */
export async function savePYQDocument(
  pyqData: Omit<PYQDocument, "id" | "downloadCount">
): Promise<string> {
  const pyqsRef = collection(db, PYQS_COLLECTION);
  
  const docRef = doc(pyqsRef);
  const pyqDoc: Omit<PYQDocument, "id"> = {
    ...pyqData,
    downloadCount: 0,
  };

  await setDoc(docRef, {
    ...pyqDoc,
    uploadedAt: Timestamp.fromDate(pyqData.uploadedAt),
  });

  return docRef.id;
}

/**
 * Get PYQ documents with optional filters
 */
export async function getPYQDocuments(
  filters: PYQFilter = {},
  maxResults: number = 1000
): Promise<PYQDocument[]> {
  const pyqsRef = collection(db, PYQS_COLLECTION);
  let q = query(pyqsRef);

  // Apply filters
  if (filters.branch) {
    q = query(q, where("branch", "==", filters.branch));
  }
  if (filters.semester) {
    q = query(q, where("semester", "==", filters.semester));
  }
  if (filters.subject) {
    q = query(q, where("subject", "==", filters.subject));
  }

  // Order by branch, semester, then subject
  q = query(q, orderBy("branch"), orderBy("semester"), orderBy("subject"), limit(maxResults));

  const snapshot = await getDocs(q);
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
      uploadedAt: (data.uploadedAt as Timestamp).toDate(),
      downloadCount: data.downloadCount || 0,
    });
  });

  // Apply client-side search filter if provided
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    return pyqs.filter(
      (pyq) =>
        pyq.subject.toLowerCase().includes(query) ||
        pyq.fileName.toLowerCase().includes(query) ||
        pyq.branch.toLowerCase().includes(query)
    );
  }

  return pyqs;
}

/**
 * Get unique branches from PYQ documents
 */
export async function getPYQBranches(): Promise<Branch[]> {
  const pyqs = await getPYQDocuments();
  const branches = new Set<Branch>();
  pyqs.forEach((pyq) => branches.add(pyq.branch));
  return Array.from(branches).sort();
}

/**
 * Get unique subjects for a given branch and semester
 */
export async function getPYQSubjects(
  branch?: Branch,
  semester?: Semester
): Promise<string[]> {
  const filters: PYQFilter = {};
  if (branch) filters.branch = branch;
  if (semester) filters.semester = semester;

  const pyqs = await getPYQDocuments(filters);
  const subjects = new Set<string>();
  pyqs.forEach((pyq) => subjects.add(pyq.subject));
  return Array.from(subjects).sort();
}

/**
 * Increment download count for a PYQ document
 */
export async function incrementPYQDownload(pyqId: string): Promise<void> {
  const pyqRef = doc(db, PYQS_COLLECTION, pyqId);
  await updateDoc(pyqRef, {
    downloadCount: increment(1),
  });
}
