import { useEffect } from "react";
import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { listenForPushTap } from "@/push";
import { colors } from "@/theme";

export default function RootLayout() {
  useEffect(() => {
    const sub = listenForPushTap(() => router.push("/notifications"));
    // Handles tapping a notification when Tokea was closed.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) router.push("/notifications");
    });
    return () => sub.remove();
  }, []);
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="welcome" options={{headerShown:false}}/>
      <Stack.Screen name="sign-in" options={{headerShown:false}}/>
      <Stack.Screen name="verification" options={{ headerShown:false }}/>
      <Stack.Screen name="privacy" options={{ headerShown:false }}/>
      <Stack.Screen name="notifications" options={{ headerShown: true, title: "Notifications", headerTintColor: colors.brand }} />
    </Stack>
  );
}
