// Common types for the Academic OS platform

export interface User {
  uid: string;
  email: string | null;
  displayName?: string | null;
}

export interface ScheduleItem {
  id: string;
  title: string;
  time: string;
  room: string;
  type: "lecture" | "assignment" | "exam" | "event";
  date: Date;
  description?: string;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  dueDate: Date;
  submitted: boolean;
  submissionDate?: Date;
  description?: string;
}

export interface PYQ {
  id: string;
  subject: string;
  year: number;
  semester: string;
  questions: string[];
  topics?: string[];
  difficulty?: "easy" | "medium" | "hard";
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  type: "workshop" | "seminar" | "cultural" | "sports" | "other";
}

export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  available: boolean;
  availableUntil?: Date;
}

export interface CanteenMenu {
  date: string;
  thaali: string[];
  platter: string[];
  special?: string[];
}
