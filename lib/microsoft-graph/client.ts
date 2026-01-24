/**
 * Microsoft Graph API Client
 * Handles OAuth2 authentication and Microsoft Teams/Education API operations
 */

const SCOPES = [
  "EduAssignments.Read",
  "EduAssignments.ReadWrite",
  "EduClasses.Read",
  "User.Read",
  "offline_access",
];

const GRAPH_API_BASE = "https://graph.microsoft.com/v1.0";

/**
 * Get Microsoft OAuth2 authorization URL
 */
export function getMicrosoftAuthUrl(state?: string): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI ||
    "http://localhost:3000/api/auth/microsoft/callback";

  if (!clientId) {
    throw new Error(
      "Microsoft OAuth credentials not configured. Please set MICROSOFT_CLIENT_ID in .env"
    );
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    redirect_uri: redirectUri,
    response_mode: "query",
    scope: SCOPES.join(" "),
    prompt: "consent", // Force consent screen to get refresh token
  });

  if (state) {
    params.append("state", state);
  }

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token: string | null;
  expires_in: number;
  expires_at: number;
}> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI ||
    "http://localhost:3000/api/auth/microsoft/callback";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Microsoft OAuth credentials not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in .env"
    );
  }

  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        scope: SCOPES.join(" "),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for tokens: ${error}`);
  }

  const data = await response.json();
  const expiresAt = Date.now() + data.expires_in * 1000;

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || null,
    expires_in: data.expires_in,
    expires_at: expiresAt,
  };
}

/**
 * Refresh access token
 */
export async function refreshAccessToken(
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token: string | null;
  expires_in: number;
  expires_at: number;
}> {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const redirectUri =
    process.env.MICROSOFT_REDIRECT_URI ||
    "http://localhost:3000/api/auth/microsoft/callback";

  if (!clientId || !clientSecret) {
    throw new Error(
      "Microsoft OAuth credentials not configured. Please set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in .env"
    );
  }

  const response = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        redirect_uri: redirectUri,
        grant_type: "refresh_token",
        scope: SCOPES.join(" "),
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to refresh token: ${error}`);
  }

  const data = await response.json();
  const expiresAt = Date.now() + data.expires_in * 1000;

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken, // Use new refresh token if provided
    expires_in: data.expires_in,
    expires_at: expiresAt,
  };
}

/**
 * Make authenticated request to Microsoft Graph API
 */
async function graphRequest(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${GRAPH_API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Graph API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get user's classes/courses from Microsoft Teams
 */
export async function getUserClasses(accessToken: string): Promise<any[]> {
  try {
    // Try Education API first
    const response = await graphRequest(
      accessToken,
      "/education/me/classes"
    );
    return response.value || [];
  } catch (error: any) {
    // If Education API is not available, try alternative endpoints
    console.warn("Education API not available, trying alternative:", error.message);
    
    // Fallback: Try to get classes from joined teams
    try {
      const teamsResponse = await graphRequest(
        accessToken,
        "/me/joinedTeams"
      );
      return teamsResponse.value || [];
    } catch (fallbackError: any) {
      console.error("Failed to fetch classes:", fallbackError);
      return [];
    }
  }
}

/**
 * Get assignments for a specific class
 */
export async function getClassAssignments(
  accessToken: string,
  classId: string
): Promise<any[]> {
  try {
    const response = await graphRequest(
      accessToken,
      `/education/classes/${classId}/assignments`
    );
    return response.value || [];
  } catch (error: any) {
    console.error(`Failed to fetch assignments for class ${classId}:`, error);
    return [];
  }
}

/**
 * Get all assignments for the user
 */
export async function getAllAssignments(accessToken: string): Promise<any[]> {
  try {
    const response = await graphRequest(
      accessToken,
      "/education/me/assignments"
    );
    return response.value || [];
  } catch (error: any) {
    console.error("Failed to fetch all assignments:", error);
    return [];
  }
}

/**
 * Get assignment submissions
 */
export async function getAssignmentSubmissions(
  accessToken: string,
  classId: string,
  assignmentId: string
): Promise<any[]> {
  try {
    const response = await graphRequest(
      accessToken,
      `/education/classes/${classId}/assignments/${assignmentId}/submissions`
    );
    return response.value || [];
  } catch (error: any) {
    console.error(
      `Failed to fetch submissions for assignment ${assignmentId}:`,
      error
    );
    return [];
  }
}

/**
 * Get user's submission for an assignment
 */
export async function getMySubmission(
  accessToken: string,
  classId: string,
  assignmentId: string
): Promise<any | null> {
  try {
    const submissions = await getAssignmentSubmissions(
      accessToken,
      classId,
      assignmentId
    );
    // Find the user's submission (you may need to filter by userId)
    return submissions[0] || null;
  } catch (error: any) {
    console.error(
      `Failed to fetch submission for assignment ${assignmentId}:`,
      error
    );
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 60000; // 1 minute buffer
}
