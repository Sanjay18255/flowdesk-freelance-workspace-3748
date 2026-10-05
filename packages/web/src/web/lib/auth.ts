import { createAuthClient } from "better-auth/react";

const TOKEN_KEY = "flowdesk-token";

export function getToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function setToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable — cookie session still works */
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to clear */
  }
}

/**
 * Email + password auth. A bearer token is stored alongside the cookie session so
 * the app keeps working inside cross-origin preview iframes.
 */
export const authClient = createAuthClient({
  baseURL: window.location.origin,
  basePath: "/api/auth",
  fetchOptions: {
    auth: { type: "Bearer", token: () => getToken() },
    onSuccess: (ctx) => {
      const token = ctx.response.headers.get("set-auth-token");
      if (token) setToken(token);
    },
  },
});

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  businessName?: string | null;
  jobTitle?: string | null;
  plan?: string | null;
};

export function useSession() {
  return authClient.useSession();
}
