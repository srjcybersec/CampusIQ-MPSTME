/**
 * Shared registration constants and validators.
 * Pure logic only (no Firebase imports) so it can be used on both the
 * client (signup form) and the server (registration API route).
 */

// Only MPSTME students (official college email domain) may register.
export const ALLOWED_EMAIL_DOMAIN = "nmims.in";

// Programs offered at MPSTME (extend as needed).
export const PROGRAMS = [
  "MBA Tech",
  "B.Tech",
  "B.Tech (Integrated)",
  "MCA",
  "Other",
] as const;

// Branches / specializations (extend as needed).
export const BRANCHES = [
  "Computer Engineering",
  "Information Technology",
  "Artificial Intelligence",
  "Artificial Intelligence & Data Science",
  "Data Science",
  "Computer Science & Engineering",
  "Mechatronics",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electronics & Telecommunication",
  "Other",
] as const;

export const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"] as const;

export interface RegistrationInput {
  name: string;
  username: string;
  email: string;
  sapId: string;
  program: string;
  branch: string;
  year: string;
  phone?: string;
  password: string;
}

/** Normalizes a username to its canonical (unique) form. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Returns an error string if the email is invalid, else null. */
export function validateEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  if (!value) return "Email is required.";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "Enter a valid email address.";
  if (!value.endsWith(`@${ALLOWED_EMAIL_DOMAIN}`)) {
    return `Only official MPSTME emails (@${ALLOWED_EMAIL_DOMAIN}) are allowed.`;
  }
  return null;
}

export function validateUsername(username: string): string | null {
  const value = normalizeUsername(username);
  if (!value) return "Username is required.";
  if (!/^[a-z0-9_]{3,20}$/.test(value)) {
    return "Username must be 3-20 characters: letters, numbers, or underscore only.";
  }
  return null;
}

export function validateSapId(sapId: string): string | null {
  const value = sapId.trim();
  if (!value) return "SAP ID is required.";
  if (!/^\d{11}$/.test(value)) return "SAP ID must be exactly 11 digits.";
  return null;
}

export function validateName(name: string): string | null {
  const value = name.trim();
  if (!value) return "Full name is required.";
  if (value.length < 2 || value.length > 60) return "Name must be between 2 and 60 characters.";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "Password is required.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must contain at least one letter and one number.";
  }
  return null;
}

export function validatePhone(phone?: string): string | null {
  if (!phone || !phone.trim()) return null; // optional
  if (!/^\d{10}$/.test(phone.trim())) return "Phone number must be 10 digits.";
  return null;
}

/** Validates the whole payload. Returns a map of field -> error (empty if valid). */
export function validateRegistration(input: RegistrationInput): Record<string, string> {
  const errors: Record<string, string> = {};

  const nameErr = validateName(input.name);
  if (nameErr) errors.name = nameErr;

  const usernameErr = validateUsername(input.username);
  if (usernameErr) errors.username = usernameErr;

  const emailErr = validateEmail(input.email);
  if (emailErr) errors.email = emailErr;

  const sapErr = validateSapId(input.sapId);
  if (sapErr) errors.sapId = sapErr;

  if (!input.program || !PROGRAMS.includes(input.program as (typeof PROGRAMS)[number])) {
    errors.program = "Please select your program.";
  }
  if (!input.branch || !BRANCHES.includes(input.branch as (typeof BRANCHES)[number])) {
    errors.branch = "Please select your branch.";
  }
  if (!input.year || !YEARS.includes(input.year as (typeof YEARS)[number])) {
    errors.year = "Please select your year.";
  }

  const phoneErr = validatePhone(input.phone);
  if (phoneErr) errors.phone = phoneErr;

  const passwordErr = validatePassword(input.password);
  if (passwordErr) errors.password = passwordErr;

  return errors;
}
