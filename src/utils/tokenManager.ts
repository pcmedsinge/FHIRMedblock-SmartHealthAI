// -----------------------------------------------------------
// tokenManager — Monitors FHIR access token expiry
// -----------------------------------------------------------

import type Client from "fhirclient/lib/Client";

export type TokenStatus = "valid" | "expiring-soon" | "expired" | "unknown";

export interface TokenInfo {
  status: TokenStatus;
  secondsRemaining: number | null;
  expiresAt: string | null;
}

const WARNING_THRESHOLD_SECONDS = 120;

function getTokenExpiresAt(client: Client): Date | null {
  try {
    const state = client.state;
    const tokenResponse = state?.tokenResponse;
    if (!tokenResponse?.expires_in) {
      return null;
    }

    const expiresInMs = tokenResponse.expires_in * 1000;
    const createdAt = (state as unknown as Record<string, unknown>).created_at;
    if (typeof createdAt === "number") {
      return new Date(createdAt + expiresInMs);
    }

    return new Date(Date.now() + expiresInMs);
  } catch {
    return null;
  }
}

export function getTokenInfo(client: Client | null): TokenInfo {
  if (!client) {
    return { status: "unknown", secondsRemaining: null, expiresAt: null };
  }

  const expiresAt = getTokenExpiresAt(client);
  if (!expiresAt) {
    return { status: "unknown", secondsRemaining: null, expiresAt: null };
  }

  const now = Date.now();
  const remaining = Math.floor((expiresAt.getTime() - now) / 1000);

  if (remaining <= 0) {
    return { status: "expired", secondsRemaining: 0, expiresAt: expiresAt.toISOString() };
  }

  if (remaining <= WARNING_THRESHOLD_SECONDS) {
    return { status: "expiring-soon", secondsRemaining: remaining, expiresAt: expiresAt.toISOString() };
  }

  return { status: "valid", secondsRemaining: remaining, expiresAt: expiresAt.toISOString() };
}

const RETURN_PATH_KEY = "epic_return_path";

export function saveReturnPath(): void {
  const path = window.location.pathname;
  if (path !== "/") {
    sessionStorage.setItem(RETURN_PATH_KEY, path);
  }
}

export function getReturnPath(): string | null {
  const path = sessionStorage.getItem(RETURN_PATH_KEY);
  if (path) {
    sessionStorage.removeItem(RETURN_PATH_KEY);
  }
  return path;
}

export function handleSessionExpired(): void {
  saveReturnPath();
  sessionStorage.clear();
  window.location.assign("/");
}

export function formatTimeRemaining(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
