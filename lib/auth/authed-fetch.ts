import { auth } from "@/lib/firebase/config";

/**
 * fetch() wrapper that attaches the current user's Firebase ID token as a
 * Bearer token. Use for every call to an API route that must know *who* the
 * caller is. The server verifies the token with the Admin SDK, so a client
 * cannot impersonate another user by passing someone else's uid.
 */
export async function authedFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const user = auth?.currentUser;
  const token = user ? await user.getIdToken() : null;

  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  // Only default to JSON for string bodies. For FormData/Blob, let the browser
  // set the correct multipart Content-Type (with boundary).
  if (!headers.has("Content-Type") && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  return fetch(input, { ...init, headers });
}
