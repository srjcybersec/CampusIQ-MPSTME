import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

/**
 * Google Calendar API Client
 * Handles OAuth2 authentication and calendar operations
 */

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

export function getOAuth2Client(): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Google OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

/**
 * Get authorization URL for OAuth2 flow
 */
export function getAuthUrl(state?: string): string {
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force consent screen to get refresh token
  });
  
  // Add state parameter if provided
  if (state) {
    const url = new URL(authUrl);
    url.searchParams.set("state", state);
    return url.toString();
  }
  
  return authUrl;
}

/**
 * Exchange authorization code for tokens
 */
export async function getTokensFromCode(code: string): Promise<{
  access_token: string;
  refresh_token: string | null;
  expiry_date: number | null;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  return {
    access_token: tokens.access_token || "",
    refresh_token: tokens.refresh_token || null,
    expiry_date: tokens.expiry_date || null,
  };
}

/**
 * Get authenticated calendar client
 */
export function getCalendarClient(accessToken: string, refreshToken?: string | null): any {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

/**
 * Refresh access token if expired
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const oauth2Client = getOAuth2Client();
  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials.access_token || "";
}

/**
 * Create calendar event
 */
export async function createCalendarEvent(
  accessToken: string,
  refreshToken: string | null,
  event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone: string };
    end: { dateTime: string; timeZone: string };
    location?: string;
  }
): Promise<any> {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken);
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });
    return response.data;
  } catch (error: any) {
    // If token expired, try to refresh
    if (error.code === 401 && refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      const calendar = getCalendarClient(newAccessToken, refreshToken);
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody: event,
      });
      return response.data;
    }
    throw error;
  }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(
  accessToken: string,
  refreshToken: string | null,
  eventId: string
): Promise<void> {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken);
    await calendar.events.delete({
      calendarId: "primary",
      eventId: eventId,
    });
  } catch (error: any) {
    // If token expired, try to refresh
    if (error.code === 401 && refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      const calendar = getCalendarClient(newAccessToken, refreshToken);
      await calendar.events.delete({
        calendarId: "primary",
        eventId: eventId,
      });
    } else {
      throw error;
    }
  }
}

/**
 * Get upcoming events from Google Calendar
 */
export async function getUpcomingEvents(
  accessToken: string,
  refreshToken: string | null,
  maxResults: number = 10
): Promise<any[]> {
  try {
    const calendar = getCalendarClient(accessToken, refreshToken);
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    });
    return response.data.items || [];
  } catch (error: any) {
    // If token expired, try to refresh
    if (error.code === 401 && refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      const calendar = getCalendarClient(newAccessToken, refreshToken);
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: "startTime",
      });
      return response.data.items || [];
    }
    throw error;
  }
}
