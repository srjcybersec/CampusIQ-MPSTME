/**
 * Content Moderation Utility
 * Checks for prohibited content in confessions
 */

const PROHIBITED_PATTERNS = [
  // Real names (common Indian names - basic check)
  /\b(raj|kumar|singh|patel|sharma|gupta|verma|mehta|jain|shah|reddy|rao|naidu|iyer|iyengar|menon|nair|pillai|krishnan|sundaram|ram|lakshmi|priya|anita|kavita|neha|riya|sneha|arjun|rahul|rohan|aman|vivek|aditya|akash|nikhil|varun|siddharth|karan|yash|harsh|rishabh|pranav|sahil|ayush|kunal|manish|vishal|nitin|sanjay|vijay|ajay|anil|sunil|mukesh|rakesh|mahesh|suresh|dinesh|pradeep|deepak|amit|sumit|rohit|mohit|sourav|sachin|virat|ms\s+dhoni|sachin\s+tendulkar)\b/gi,
  
  // Targeting patterns
  /\b(you\s+are|you're|you\s+should|you\s+need|you\s+must|you\s+have\s+to|fuck\s+you|kill\s+yourself|kys|die|hate\s+you|disgusting|pathetic|loser|idiot|stupid|dumb|moron|retard)\b/gi,
  
  // Explicit content
  /\b(sex|sexual|porn|nude|naked|fuck|fucking|shit|damn|bitch|asshole|bastard|cunt|pussy|dick|penis|vagina|orgasm|masturbat|rape|molest)\b/gi,
  
  // Hate speech indicators
  /\b(kill|murder|suicide|bomb|terrorist|attack|violence|weapon|gun|knife|stab|shoot)\b/gi,
  
  // Phone numbers and emails (potential doxxing)
  /\b\d{10}|\d{3}[-.]?\d{3}[-.]?\d{4}|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/gi,
];

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

export interface ModerationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function moderateContent(content: string): ModerationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Length check
  if (content.length < MIN_LENGTH) {
    errors.push(`Confession must be at least ${MIN_LENGTH} characters long`);
  }
  
  if (content.length > MAX_LENGTH) {
    errors.push(`Confession must be less than ${MAX_LENGTH} characters`);
  }

  // Check for prohibited patterns
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(content)) {
      if (pattern.source.includes('name') || pattern.source.includes('targeting')) {
        errors.push("Content contains prohibited elements (names or targeting)");
      } else if (pattern.source.includes('explicit') || pattern.source.includes('hate')) {
        errors.push("Content contains inappropriate language");
      } else {
        warnings.push("Content may contain sensitive information");
      }
      break; // Only report first match
    }
  }

  // Check for excessive repetition (spam)
  const words = content.toLowerCase().split(/\s+/);
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const maxRepetition = Math.max(...Object.values(wordCounts));
  if (maxRepetition > 10) {
    warnings.push("Content may be spam due to excessive repetition");
  }

  // Check for all caps (shouting)
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.7 && content.length > 20) {
    warnings.push("Please avoid using all caps");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function sanitizeContent(content: string): string {
  // Remove leading/trailing whitespace
  let sanitized = content.trim();
  
  // Replace multiple spaces with single space
  sanitized = sanitized.replace(/\s+/g, ' ');
  
  // Remove excessive line breaks (more than 2 consecutive)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  return sanitized;
}
