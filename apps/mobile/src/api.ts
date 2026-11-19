import * as SecureStore from "expo-secure-store";

export type InboxItem = {
  id: string; kind: string; title: string; body: string; route: string;
  createdAt: string; readAt: string | null;
};
const TOKEN_KEY = "tokea_access_token";

/** Populated only by the future real OTP + adult verification sign-in flow. */
export async function getAccessToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function saveVerifiedSessionToken(token: string) {
  if (!token) throw new Error("A verified server-issued access token is required.");
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearSessionToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function api<T>(path: string, method = "GET", body?: object): Promise<T> {
  const base = process.env.EXPO_PUBLIC_API_URL;
  if (!base || !base.startsWith("https://")) throw Error("A secure Tokea API endpoint is not configured.");
  const accessToken = await getAccessToken();
  if (!accessToken) throw Error("Sign in and verify your age to connect to Tokea.");
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw Error(response.status === 401 ? "Please sign in again." : `Tokea request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function fetchInbox() {
  return (await api<{ notifications: InboxItem[] }>("/v1/notifications")).notifications;
}

export async function markNotificationRead(id: string) {
  return api<{ updated: boolean }>(`/v1/notifications/${encodeURIComponent(id)}/read`, "PATCH");
}

/** Only safe-to-display session fields; no precise address or contact data. */
export type DiscoverSession = {
  id: string;
  title: string;
  category: string;
  neighbourhood: string;
  hostName: string;
  startsAt: string;
  endsAt: string;
  seatsRemaining: number;
  isHost: boolean;
};

export async function fetchDiscoverSessions() {
  return (await api<{ sessions: DiscoverSession[] }>("/v1/sessions")).sessions;
}
