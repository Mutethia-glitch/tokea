import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/theme";

const Icon = ({ glyph, active }: { glyph: string; active: boolean }) =>
  <Text style={{ color: active ? colors.brand : colors.muted, fontSize: 20 }}>{glyph}</Text>;

export default function TokeaTabs() {
  return <Tabs screenOptions={{
    tabBarActiveTintColor: colors.brand,
    tabBarInactiveTintColor: colors.muted,
    tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, minHeight: 62 },
    tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
    headerShown: false,
  }}>
    <Tabs.Screen name="index" options={{ title: "Discover", tabBarIcon: ({ focused }) => <Icon glyph="⌕" active={focused} /> }} />
    <Tabs.Screen name="requests" options={{ title: "Requests", tabBarIcon: ({ focused }) => <Icon glyph="✉" active={focused} /> }} />
    <Tabs.Screen name="chats" options={{ title: "Chats", tabBarIcon: ({ focused }) => <Icon glyph="☷" active={focused} /> }} />
    <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ focused }) => <Icon glyph="◯" active={focused} /> }} />
  </Tabs>;
}
