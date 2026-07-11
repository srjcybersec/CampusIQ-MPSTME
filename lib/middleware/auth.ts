import { NextRequest } from "next/server";
import { getAdminAuth } from "@/lib/firebase/admin";

/**
 * Verify Firebase ID token from Authorization header
 * Returns the authenticated user ID or throws an error
 */
export async function verifyAuthToken(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const idToken = authHeader.split("Bearer ")[1];
  
  if (!idToken) {
    throw new Error("Missing ID token");
  }

  try {
    // Get Firebase Admin Auth
    const auth = await getAdminAuth();
    
    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    
    return decodedToken.uid;
  } catch (error: any) {
    console.error("Token verification error:", error);
    throw new Error(`Invalid or expired token: ${error.message}`);
  }
}

/**
 * Middleware to verify authentication and extract user ID
 * Use this in API routes that require authentication
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   try {
 *     const userId = await verifyAuth(request);
 *     // Use userId safely...
 *   } catch (error) {
 *     return NextResponse.json({ error: error.message }, { status: 401 });
 *   }
 * }
 */
export async function verifyAuth(request: NextRequest): Promise<string> {
  try {
    return await verifyAuthToken(request);
  } catch (error: any) {
    throw error;
  }
}

/**
 * Verify that the userId in request matches the authenticated user
 * Use this when userId is passed as query param or in body
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   try {
 *     const authUserId = await verifyAuth(request);
 *     const requestUserId = request.nextUrl.searchParams.get("userId");
 *     verifyUserIdMatch(authUserId, requestUserId);
 *     // Use authUserId safely...
 *   } catch (error) {
 *     return NextResponse.json({ error: error.message }, { status: 401 });
 *   }
 * }
 */
export function verifyUserIdMatch(authUserId: string, requestUserId: string | null): void {
  if (!requestUserId) {
    throw new Error("User ID is required");
  }
  
  if (authUserId !== requestUserId) {
    throw new Error("User ID mismatch - unauthorized access");
  }
}

/**
 * Helper to get userId from request with authentication check
 * Supports both Authorization header and userId query param/body
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   try {
 *     const userId = await getAuthenticatedUserId(request);
 *     // Use userId safely...
 *   } catch (error) {
 *     return NextResponse.json({ error: error.message }, { status: 401 });
 *   }
 * }
 */
export async function getAuthenticatedUserId(
  request: NextRequest,
  userIdFromRequest?: string | null
): Promise<string> {
  // First, try to get userId from Authorization header
  try {
    const authUserId = await verifyAuthToken(request);
    
    // If userId was provided in request, verify it matches
    if (userIdFromRequest) {
      verifyUserIdMatch(authUserId, userIdFromRequest);
    }
    
    return authUserId;
  } catch (error: any) {
    // If Authorization header fails, check if userId was provided directly
    // This is a fallback for backward compatibility, but less secure
    if (userIdFromRequest) {
      console.warn("Using userId from request without token verification - consider migrating to Authorization header");
      return userIdFromRequest;
    }
    
    throw error;
  }
}
