/**
 * Input validation utilities
 */

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number = 50): { valid: boolean; error?: string } {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(
  file: File,
  allowedTypes: string[] = ["application/pdf", "image/jpeg", "image/png", "image/jpg"]
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }
  
  return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate user ID format (Firebase UID)
 */
export function validateUserId(userId: string): boolean {
  // Firebase UIDs are typically 28 characters, alphanumeric
  return /^[a-zA-Z0-9]{20,}$/.test(userId);
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 10000): string {
  return input.trim().slice(0, maxLength);
}

/**
 * Validate amount (for payments)
 */
export function validateAmount(amount: number): { valid: boolean; error?: string } {
  if (typeof amount !== "number" || isNaN(amount)) {
    return { valid: false, error: "Amount must be a valid number" };
  }
  
  if (amount <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }
  
  if (amount > 100000) {
    return { valid: false, error: "Amount exceeds maximum limit of ₹100,000" };
  }
  
  return { valid: true };
}

/**
 * Validate array of items (for orders)
 */
export function validateOrderItems(items: any[]): { valid: boolean; error?: string } {
  if (!Array.isArray(items)) {
    return { valid: false, error: "Items must be an array" };
  }
  
  if (items.length === 0) {
    return { valid: false, error: "At least one item is required" };
  }
  
  if (items.length > 50) {
    return { valid: false, error: "Maximum 50 items per order" };
  }
  
  for (const item of items) {
    if (!item.name || typeof item.name !== "string") {
      return { valid: false, error: "Each item must have a valid name" };
    }
    
    if (typeof item.quantity !== "number" || item.quantity <= 0) {
      return { valid: false, error: "Each item must have a valid quantity" };
    }
    
    if (typeof item.price !== "number" || item.price < 0) {
      return { valid: false, error: "Each item must have a valid price" };
    }
  }
  
  return { valid: true };
}

/**
 * Validate required fields in object
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): { valid: boolean; error?: string } {
  const missing = requiredFields.filter((field) => !data[field] && data[field] !== 0);
  
  if (missing.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missing.join(", ")}`,
    };
  }
  
  return { valid: true };
}
