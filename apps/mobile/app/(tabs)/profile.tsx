import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Heading, Paper, Screen } from "@/ui";
import { colors } from "@/theme";
import { enablePhoneNotifications } from "@/push";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  async function optIn() {
    setLoading(true);
    try {
      await enablePhoneNotifications();
      setEnabled(true);
      Alert.alert("Notifications enabled", "Invitation updates can now appear on your phone.");
    } catch (error) {
      Alert.alert("Unable to enable notifications", error instanceof Error ? error.message : "Please try again.");
    } finally { setLoading(false); }
  }
  return <Screen>
    <Heading title="Profile" subtitle="Your Tokea account, privacy and notifications." />
    <Paper>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 8 }}>Phone verification</Text>
      <Text style={{ color: colors.muted, lineHeight: 21, marginBottom: 12 }}>Test a Kenyan number with SMS. This is not account sign-in or age verification.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push("/verify-phone")}
        style={{ minHeight: 46, backgroundColor: colors.brandSoft, borderRadius: 14, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: colors.brand, fontWeight: "700" }}>Verify phone number</Text>
      </Pressable>
    </Paper>
    <Paper>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "600" }}>Phone notifications</Text>
      <Text style={{ color: colors.muted, lineHeight: 21, marginVertical: 11 }}>
        Get notified when a host accepts or declines your request. You can still see important updates inside Tokea if phone notifications are off.
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Enable phone notifications"
        disabled={loading || enabled} onPress={optIn}
        style={{ backgroundColor: colors.brand, minHeight: 46, borderRadius: 14, justifyContent: "center", alignItems: "center", opacity: loading || enabled ? 0.6 : 1 }}>
        <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{loading ? "Enabling…" : enabled ? "Enabled for this session" : "Enable phone notifications"}</Text>
      </Pressable>
    </Paper>
    <Paper>
      <Pressable accessibilityRole="button" onPress={() => router.push("/notifications")} style={{ minHeight: 44, justifyContent: "center" }}>
        <Text style={{ color: colors.brand, fontWeight: "700" }}>See in-app notifications</Text>
      </Pressable>
    </Paper>
    <Paper>
      <Pressable accessibilityRole="button" accessibilityLabel="About Tokea and copyright" onPress={() => router.push("/about")}
        style={{ minHeight: 44, justifyContent: "center" }}>
        <Text style={{ color: colors.brand, fontWeight: "700" }}>About Tokea · Copyright</Text>
      </Pressable>
    </Paper>
    <View style={{ marginTop: 5 }}>
      <Text style={{ color: colors.muted, fontSize: 13, marginBottom: 8 }}>For adults 18+ only</Text>
      <Text style={{ color: colors.muted, fontSize: 12 }}>© 2026 Tokea. All rights reserved.</Text>
    </View>
  </Screen>;
}
