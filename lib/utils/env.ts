/**
 * Environment variable validation
 */

interface EnvConfig {
  [key: string]: {
    required: boolean;
    description: string;
    validator?: (value: string) => boolean;
  };
}

const ENV_CONFIG: EnvConfig = {
  // Firebase
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: {
    required: true,
    description: "Firebase project ID",
  },
  FIREBASE_CLIENT_EMAIL: {
    required: true,
    description: "Firebase Admin client email",
  },
  FIREBASE_PRIVATE_KEY: {
    required: true,
    description: "Firebase Admin private key",
  },
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: {
    required: true,
    description: "Firebase Storage bucket name",
  },
  
  // Gemini API
  NEXT_PUBLIC_GEMINI_API_KEY: {
    required: true,
    description: "Google Gemini API key",
  },
  
  // Razorpay
  RAZORPAY_KEY_ID: {
    required: true,
    description: "Razorpay key ID",
  },
  RAZORPAY_KEY_SECRET: {
    required: true,
    description: "Razorpay key secret",
  },
  RAZORPAY_WEBHOOK_SECRET: {
    required: false,
    description: "Razorpay webhook secret (optional)",
  },
  
  // Google OAuth
  GOOGLE_CLIENT_ID: {
    required: false,
    description: "Google OAuth client ID (optional)",
  },
  GOOGLE_CLIENT_SECRET: {
    required: false,
    description: "Google OAuth client secret (optional)",
  },
  
  // Microsoft OAuth
  MICROSOFT_CLIENT_ID: {
    required: false,
    description: "Microsoft OAuth client ID (optional)",
  },
  MICROSOFT_CLIENT_SECRET: {
    required: false,
    description: "Microsoft OAuth client secret (optional)",
  },
  
  // App URL
  NEXT_PUBLIC_APP_URL: {
    required: false,
    description: "Application URL (optional, defaults to localhost)",
  },
  VERCEL_URL: {
    required: false,
    description: "Vercel deployment URL (optional)",
  },
};

/**
 * Validate environment variables
 * Call this on app startup
 */
export function validateEnv(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const [key, config] of Object.entries(ENV_CONFIG)) {
    const value = process.env[key];
    
    if (config.required && !value) {
      errors.push(`Missing required environment variable: ${key} (${config.description})`);
      continue;
    }
    
    if (value && config.validator && !config.validator(value)) {
      errors.push(`Invalid value for environment variable: ${key} (${config.description})`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get environment variable with validation
 */
export function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && defaultValue === undefined) {
    const config = ENV_CONFIG[key];
    if (config?.required) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  
  return value || defaultValue || "";
}

/**
 * Log environment status (for debugging)
 */
export function logEnvStatus(): void {
  const validation = validateEnv();
  
  if (validation.valid) {
    console.log("✅ All required environment variables are set");
  } else {
    console.error("❌ Environment variable validation failed:");
    validation.errors.forEach((error) => console.error(`  - ${error}`));
  }
  
  // Log optional variables that are set
  const optionalSet = Object.entries(ENV_CONFIG)
    .filter(([key, config]) => !config.required && process.env[key])
    .map(([key]) => key);
  
  if (optionalSet.length > 0) {
    console.log(`ℹ️  Optional environment variables set: ${optionalSet.join(", ")}`);
  }
}
