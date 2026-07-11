import { NextRequest, NextResponse } from "next/server";
import { validateEnv } from "@/lib/utils/env";

/**
 * GET /api/health
 * Health check endpoint that validates environment variables
 */
export async function GET(request: NextRequest) {
  const envValidation = validateEnv();
  
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: {
        valid: envValidation.valid,
        errors: envValidation.errors,
      },
    },
    { status: envValidation.valid ? 200 : 503 }
  );
}
