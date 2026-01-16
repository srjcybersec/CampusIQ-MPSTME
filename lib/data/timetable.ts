/**
 * MPSTME College Timetable Data
 * B.Tech CSE (Cyber Security) - Semester VI
 * Academic Year 2025-26
 * Effective from: January 12, 2026
 * Division: K
 */

export interface TimetableEntry {
  id: string;
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  time: string; // Format: "HH:MM-HH:MM"
  startTime: string; // Format: "HH:MM"
  endTime: string; // Format: "HH:MM"
  subject: string;
  subjectCode: string;
  faculty: string;
  facultyInitials: string;
  room: string;
  batch?: "K1" | "K2"; // Batch designation for parallel classes
  type?: "lecture" | "lab" | "break" | "placement" | "elective";
}

export const TIMETABLE_DATA: TimetableEntry[] = [
  // Monday
  { id: "mon-1", day: "Monday", time: "09:00-10:00", startTime: "09:00", endTime: "10:00", subject: "Digital Forensics and Incident Response", subjectCode: "DFIR", faculty: "Prof. Rohit Suryawanshi", facultyInitials: "RSU", room: "CR-507", type: "lecture" },
  { id: "mon-2", day: "Monday", time: "10:00-11:00", startTime: "10:00", endTime: "11:00", subject: "Digital Forensics and Incident Response", subjectCode: "DFIR", faculty: "Prof. Rohit Suryawanshi", facultyInitials: "RSU", room: "CR-507", type: "lecture" },
  { id: "mon-3", day: "Monday", time: "11:00-12:00", startTime: "11:00", endTime: "12:00", subject: "Break", subjectCode: "BREAK", faculty: "", facultyInitials: "", room: "", type: "break" },
  // Monday 12:00-14:00: VAPT (K1) and SA (K2) - batch wise parallel classes
  { id: "mon-4-k1", day: "Monday", time: "12:00-13:00", startTime: "12:00", endTime: "13:00", subject: "Vulnerability Assessment and Penetration Testing", subjectCode: "VAPT", faculty: "Dr. Pintu Shah", facultyInitials: "PHP", room: "CR-606", batch: "K1", type: "lecture" },
  { id: "mon-5-k1", day: "Monday", time: "13:00-14:00", startTime: "13:00", endTime: "14:00", subject: "Vulnerability Assessment and Penetration Testing", subjectCode: "VAPT", faculty: "Dr. Pintu Shah", facultyInitials: "PHP", room: "CR-606", batch: "K1", type: "lecture" },
  { id: "mon-4-k2", day: "Monday", time: "12:00-13:00", startTime: "12:00", endTime: "13:00", subject: "System Administration", subjectCode: "SA", faculty: "Dr. Vikram Kulkarni", facultyInitials: "VKU", room: "CL-501", batch: "K2", type: "lecture" },
  { id: "mon-5-k2", day: "Monday", time: "13:00-14:00", startTime: "13:00", endTime: "14:00", subject: "System Administration", subjectCode: "SA", faculty: "Dr. Vikram Kulkarni", facultyInitials: "VKU", room: "CL-501", batch: "K2", type: "lecture" },
  { id: "mon-6", day: "Monday", time: "14:00-15:00", startTime: "14:00", endTime: "15:00", subject: "Break", subjectCode: "BREAK", faculty: "", facultyInitials: "", room: "", type: "break" },
  { id: "mon-7", day: "Monday", time: "15:00-16:00", startTime: "15:00", endTime: "16:00", subject: "Application Security Testing", subjectCode: "AST", faculty: "Prof. Pratidnya Hegdepatil", facultyInitials: "PHP", room: "CR-501", type: "lecture" },
  { id: "mon-8", day: "Monday", time: "16:00-19:00", startTime: "16:00", endTime: "19:00", subject: "Optional Elective 3", subjectCode: "OE3", faculty: "", facultyInitials: "", room: "", type: "elective" },
  
  // Tuesday
  // Tuesday 9:00-10:00: AST (K1) and MDSF (K2) - batch wise parallel classes
  { id: "tue-1-k1", day: "Tuesday", time: "09:00-10:00", startTime: "09:00", endTime: "10:00", subject: "Application Security Testing", subjectCode: "AST", faculty: "Prof. Pratidnya Hegdepatil", facultyInitials: "PHP", room: "CR-501", batch: "K1", type: "lecture" },
  { id: "tue-1-k2", day: "Tuesday", time: "09:00-10:00", startTime: "09:00", endTime: "10:00", subject: "Mobile Device Security and Forensics", subjectCode: "MDSF", faculty: "Prof. Rejo Mathew", facultyInitials: "RMA", room: "CR-603", batch: "K2", type: "lecture" },
  { id: "tue-2", day: "Tuesday", time: "10:00-11:00", startTime: "10:00", endTime: "11:00", subject: "Vulnerability Assessment and Penetration Testing", subjectCode: "VAPT", faculty: "Dr. Pintu Shah", facultyInitials: "PHP", room: "CR-606", type: "lecture" },
  { id: "tue-4", day: "Tuesday", time: "11:00-12:00", startTime: "11:00", endTime: "12:00", subject: "Break", subjectCode: "BREAK", faculty: "", facultyInitials: "", room: "", type: "break" },
  { id: "tue-5", day: "Tuesday", time: "12:00-13:00", startTime: "12:00", endTime: "13:00", subject: "Placement Training", subjectCode: "PT", faculty: "", facultyInitials: "", room: "CR-606", type: "placement" },
  { id: "tue-6", day: "Tuesday", time: "13:00-14:00", startTime: "13:00", endTime: "14:00", subject: "Placement Training", subjectCode: "PT", faculty: "", facultyInitials: "", room: "CR-606", type: "placement" },
  { id: "tue-7", day: "Tuesday", time: "14:00-15:00", startTime: "14:00", endTime: "15:00", subject: "Break", subjectCode: "BREAK", faculty: "", facultyInitials: "", room: "", type: "break" },
  { id: "tue-8", day: "Tuesday", time: "15:00-16:00", startTime: "15:00", endTime: "16:00", subject: "Interpersonal Skills", subjectCode: "IS", faculty: "Dr. Snigdha Subhrasmita", facultyInitials: "SSU", room: "CL-506", type: "lecture" },
  { id: "tue-9", day: "Tuesday", time: "16:00-19:00", startTime: "16:00", endTime: "19:00", subject: "Optional Elective 3", subjectCode: "OE3", faculty: "", facultyInitials: "", room: "", type: "elective" },
  
  // Wednesday
  { id: "wed-1", day: "Wednesday", time: "09:00-10:00", startTime: "09:00", endTime: "10:00", subject: "Reverse Engineering and Malware Analysis", subjectCode: "REMA", faculty: "Prof. Dhanashree Kulkarni", facultyInitials: "DHU", room: "CL-802", type: "lecture" },
  // Wednesday 10:00-11:00: REMA (K1) and BSF (K2) - batch wise parallel classes
  { id: "wed-2-k1", day: "Wednesday", time: "10:00-11:00", startTime: "10:00", endTime: "11:00", subject: "Reverse Engineering and Malware Analysis", subjectCode: "REMA", faculty: "Prof. Dhanashree Kulkarni", facultyInitials: "DHU", room: "CL-802", batch: "K1", type: "lecture" },
  { id: "wed-2-k2", day: "Wednesday", time: "10:00-11:00", startTime: "10:00", endTime: "11:00", subject: "Blockchain Security", subjectCode: "BSF", faculty: "Dr. Pintu Shah", facultyInitials: "PHP", room: "CR-508", batch: "K2", type: "lecture" },
  { id: "wed-4", day: "Wednesday", time: "11:00-12:00", startTime: "11:00", endTime: "12:00", subject: "Break", subjectCode: "BREAK", faculty: "", facultyInitials: "", room: "", type: "break" },
  { id: "wed-5", day: "Wednesday", time: "12:00-13:00", startTime: "12:00", endTime: "13:00", subject: "Placement Training", subjectCode: "PT", faculty: "", facultyInitials: "", room: "CR-501", type: "placement" },
  { id: "wed-6", day: "Wednesday", time: "13:00-14:00", startTime: "13:00", endTime: "14:00", subject: "Placement Training", subjectCode: "PT", faculty: "", facultyInitials: "", room: "CR-501", type: "placement" },
  { id: "wed-7", day: "Wednesday", time: "14:00-15:00", startTime: "14:00", endTime: "15:00", subject: "Break", subjectCode: "BREAK", faculty: "", facultyInitials: "", room: "", type: "break" },
  { id: "wed-8", day: "Wednesday", time: "15:00-16:00", startTime: "15:00", endTime: "16:00", subject: "Renewable Energy Sources", subjectCode: "RES", faculty: "", facultyInitials: "", room: "CL-505", type: "lecture" },
  { id: "wed-9", day: "Wednesday", time: "16:00-19:00", startTime: "16:00", endTime: "19:00", subject: "Optional Elective 4", subjectCode: "OE4", faculty: "", facultyInitials: "", room: "", type: "elective" },
  
  // Thursday
  { id: "thu-1", day: "Thursday", time: "09:00-10:00", startTime: "09:00", endTime: "10:00", subject: "Vulnerability Assessment and Penetration Testing", subjectCode: "VAPT", faculty: "Dr. Pintu Shah", facultyInitials: "PHP", room: "CR-606", type: "lecture" },
  { id: "thu-2", day: "Thursday", time: "10:00-11:00", startTime: "10:00", endTime: "11:00", subject: "Vulnerability Assessment and Penetration Testing", subjectCode: "VAPT", faculty: "Dr. Pintu Shah", facultyInitials: "PHP", room: "CR-606", type: "lecture" },
  { id: "thu-3", day: "Thursday", time: "11:00-12:00", startTime: "11:00", endTime: "12:00", subject: "Break", subjectCode: "BREAK", faculty: "", facultyInitials: "", room: "", type: "break" },
  { id: "thu-4", day: "Thursday", time: "12:00-13:00", startTime: "12:00", endTime: "13:00", subject: "Mobile Device Security and Forensics", subjectCode: "MDSF", faculty: "Prof. Rejo Mathew", facultyInitials: "RMA", room: "CR-507", type: "lecture" },
  { id: "thu-5", day: "Thursday", time: "13:00-14:00", startTime: "13:00", endTime: "14:00", subject: "Mobile Device Security and Forensics", subjectCode: "MDSF", faculty: "Prof. Rejo Mathew", facultyInitials: "RMA", room: "CR-507", type: "lecture" },
  { id: "thu-6", day: "Thursday", time: "14:00-15:00", startTime: "14:00", endTime: "15:00", subject: "Break", subjectCode: "BREAK", faculty: "", facultyInitials: "", room: "", type: "break" },
  { id: "thu-7", day: "Thursday", time: "15:00-16:00", startTime: "15:00", endTime: "16:00", subject: "System Administration", subjectCode: "SA", faculty: "Dr. Vikram Kulkarni", facultyInitials: "VKU", room: "CL-501", type: "lecture" },
  { id: "thu-8", day: "Thursday", time: "16:00-19:00", startTime: "16:00", endTime: "19:00", subject: "Optional Elective 4", subjectCode: "OE4", faculty: "", facultyInitials: "", room: "", type: "elective" },
  
  // Friday
  { id: "fri-1", day: "Friday", time: "09:00-10:00", startTime: "09:00", endTime: "10:00", subject: "Reverse Engineering and Malware Analysis", subjectCode: "REMA", faculty: "Prof. Dhanashree Kulkarni", facultyInitials: "DHU", room: "CL-802", batch: "K2", type: "lecture" },
  { id: "fri-2", day: "Friday", time: "10:00-11:00", startTime: "10:00", endTime: "11:00", subject: "Digital Forensics and Incident Response", subjectCode: "DFIR", faculty: "Prof. Rohit Suryawanshi", facultyInitials: "RSU", room: "CR-507", type: "lecture" },
  { id: "fri-3", day: "Friday", time: "11:00-12:00", startTime: "11:00", endTime: "12:00", subject: "Break", subjectCode: "BREAK", faculty: "", facultyInitials: "", room: "", type: "break" },
  { id: "fri-4", day: "Friday", time: "12:00-13:00", startTime: "12:00", endTime: "13:00", subject: "Placement Training", subjectCode: "PT", faculty: "", facultyInitials: "", room: "CC-802", type: "placement" },
  { id: "fri-5", day: "Friday", time: "13:00-14:00", startTime: "13:00", endTime: "14:00", subject: "Placement Training", subjectCode: "PT", faculty: "", facultyInitials: "", room: "CC-802", type: "placement" },
  { id: "fri-6", day: "Friday", time: "14:00-15:00", startTime: "14:00", endTime: "15:00", subject: "Break", subjectCode: "BREAK", faculty: "", facultyInitials: "", room: "", type: "break" },
  { id: "fri-7", day: "Friday", time: "15:00-16:00", startTime: "15:00", endTime: "16:00", subject: "Introductory course on SAP", subjectCode: "SAP", faculty: "", facultyInitials: "", room: "TR-501", type: "lecture" },
  { id: "fri-8", day: "Friday", time: "16:00-19:00", startTime: "16:00", endTime: "19:00", subject: "Optional Elective 3", subjectCode: "OE3", faculty: "", facultyInitials: "", room: "", type: "elective" },
];

// Subject mappings
export const SUBJECT_MAPPINGS: Record<string, string> = {
  "DFIR": "Digital Forensics and Incident Response",
  "AST": "Application Security Testing",
  "MDSF": "Mobile Device Security and Forensics",
  "VAPT": "Vulnerability Assessment and Penetration Testing",
  "REMA": "Reverse Engineering and Malware Analysis",
  "BSF": "Blockchain Security",
  "IS": "Interpersonal Skills",
  "SA": "System Administration",
  "RES": "Renewable Energy Sources",
  "SAP": "Introductory course on SAP",
  "PT": "Placement Training",
  "OE3": "Optional Elective 3",
  "OE4": "Optional Elective 4",
};

// Faculty mappings
export const FACULTY_MAPPINGS: Record<string, string> = {
  "RSU": "Prof. Rohit Suryawanshi",
  "PHP": "Prof. Pratidnya Hegdepatil / Dr. Pintu Shah",
  "RMA": "Prof. Rejo Mathew",
  "DHU": "Prof. Dhanashree Kulkarni",
  "VKU": "Dr. Vikram Kulkarni",
  "SSU": "Dr. Snigdha Subhrasmita",
  "PRS": "Prof. (to be confirmed)", // BSF faculty
};

// Room location notes
export const ROOM_NOTES = {
  "CL-501": "5th Floor",
  "CL-502": "5th Floor",
  "CL-505": "5th Floor",
  "CL-506": "5th Floor",
  "CL-802": "8th Floor",
};
