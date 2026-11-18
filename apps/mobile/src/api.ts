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
  const loopback = !!base && /^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2):[0-9]{2,5}$/.test(base);
  const allowedLocal = __DEV__ && process.env.EXPO_PUBLIC_ALLOW_LOOPBACK_HTTP === "true" && loopback;
  if (!base || !(base.startsWith("https://") || allowedLocal))
    throw Error("Secure Tokea API is not configured. Local HTTP is limited to emulator loopback during development.");
  const accessToken = await getAccessToken();
  if (!accessToken) throw Error("Sign in and verify your age to connect to Tokea.");
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    let message = "";
    try {
      const payload = await response.json() as { error?: unknown };
      if (typeof payload.error === "string" && payload.error.length < 180) message = payload.error;
    } catch { /* Server response was not JSON. */ }
    throw Error(response.status === 401 ? "Please sign in again." :
      message || `Tokea request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function fetchInbox() {
  return (await api<{ notifications: InboxItem[] }>("/v1/notifications")).notifications;
}

export async function markNotificationRead(id: string) {
  return api<{ updated: boolean }>(`/v1/notifications/${encodeURIComponent(id)}/read`, "PATCH");
}
