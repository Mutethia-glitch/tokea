import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { Heading, Paper, Screen } from "@/ui";
import { colors } from "@/theme";

export default function DiscoverScreen() {
  return <Screen>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
      <Text style={{ fontSize: 27, color: colors.brand, fontWeight: "700" }}>tokea</Text>
      <Pressable onPress={() => router.push("/notifications")} accessibilityRole="button" accessibilityLabel="Open notifications"
        style={{ borderColor: colors.border, borderWidth: 1, borderRadius: 30, paddingVertical: 11, paddingHorizontal: 14 }}>
        <Text style={{ color: colors.text }}>Notifications</Text>
      </Pressable>
    </View>
    <Heading title="Who's out nearby?" subtitle="Find people to share a drink with. Meet somewhere public." />
    <Paper>
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: "600", marginBottom: 8 }}>Native discovery is coming together</Text>
      <Text style={{ color: colors.muted, lineHeight: 21 }}>
        The iOS and Android screens will reuse the approved Tokea design. Live sessions will load from the authenticated API after signup, age assurance and session discovery endpoints are connected.
      </Text>
    </Paper>
    <Text style={{ color: colors.muted, fontSize: 13 }}>For adults 18+ only</Text>
  </Screen>;
}
