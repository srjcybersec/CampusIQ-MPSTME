export type Branch = 
  | "Computer Science"
  | "Electronics"
  | "Mechanical"
  | "Civil"
  | "Electrical"
  | "Chemical"
  | "Aerospace"
  | "Biotechnology"
  | "Information Technology"
  | "Automobile"
  | "Artificial Intelligence"
  | "Computer"
  | "Csbs"
  | "Cse Cyber Security"
  | "Data Science"
  | "Extc"
  | "Other";

export type Semester = "5" | "6";

export interface PYQDocument {
  id: string;
  branch: Branch;
  semester: Semester;
  subject: string;
  fileName: string;
  fileUrl: string;
  storagePath: string;
  fileSize: number; // in bytes
  uploadedAt: Date;
  downloadCount: number;
}

export interface PYQFilter {
  branch?: Branch;
  semester?: Semester;
  subject?: string;
  searchQuery?: string;
}
