import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { api, getAccessToken } from "./api";

const CHANNEL = "tokea_updates";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Called only after the user explicitly opts in. Does not run on first launch.
 * Requires a real EAS project, FCM/APNs credentials and a development build.
 */
export async function enablePhoneNotifications() {
  if (Platform.OS !== "android" && Platform.OS !== "ios") throw Error("Use Tokea on a phone to enable push notifications.");
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (typeof projectId !== "string" || projectId.startsWith("SET_REAL_")) {
    throw Error("Tokea push configuration is not ready yet.");
  }
  if (!process.env.EXPO_PUBLIC_API_URL?.startsWith("https://")) {
    throw Error("Tokea API connection is not ready yet.");
  }
  if (!(await getAccessToken())) {
    throw Error("Sign in before enabling phone notifications.");
  }
  // Only now are we ready to request the system's notification permission.
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "Tokea updates",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
  if (!permission.granted) throw Error("Notification permission was not granted.");

  const pushToken = await Notifications.getExpoPushTokenAsync({ projectId });
  await api("/v1/devices", "POST", { token: pushToken.data, platform: Platform.OS });
  return true;
}

export function listenForPushTap(onTap: () => void) {
  return Notifications.addNotificationResponseReceivedListener(() => onTap());
}
