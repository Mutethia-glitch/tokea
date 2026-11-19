import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { fetchDiscoverSessions, type DiscoverSession } from "@/api";
import { SessionCard } from "@/session-card";
import { Heading } from "@/ui";
import { colors, layout } from "@/theme";

const DRINKS = [
  "All", "Beer", "Wine", "Cocktails", "Muratina", "Whiskey", "Vodka",
  "Gin", "Rum", "Tequila", "Brandy", "Spirits", "Coffee", "Soft drinks", "Tea",
];

export default function DiscoverScreen() {
  const [sessions, setSessions] = useState<DiscoverSession[]>([]);
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setSessions(await fetchDiscoverSessions()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load sessions."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  const visible = useMemo(() => sessions.filter((session) =>
    category === "All" || session.category === category), [category, sessions]);

  return <ScrollView style={{ flex: 1, backgroundColor: colors.background }}
    contentContainerStyle={{ paddingBottom: 52 }}
    keyboardShouldPersistTaps="handled">
    <View style={{ width: "100%", maxWidth: layout.maxWidth, alignSelf: "center", padding: layout.contentPadding }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <Text style={{ fontSize: 27, color: colors.brand, fontWeight: "700" }}>tokea</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Open notifications"
          onPress={() => router.push("/notifications")}
          style={{ borderColor: colors.border, backgroundColor: colors.card, borderWidth: 1, borderRadius: 30, minHeight: 44, justifyContent: "center", paddingHorizontal: 15 }}>
          <Text style={{ color: colors.text, fontWeight: "600" }}>Notifications</Text>
        </Pressable>
      </View>
      <Heading title="Who's out nearby?" subtitle="Find people to share a drink with. Meet somewhere public." />
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 10 }}>Explore by drink</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingBottom: 18 }}>
        {DRINKS.map((drink) => <Pressable key={drink}
          accessibilityRole="button" accessibilityState={{ selected: category === drink }}
          onPress={() => setCategory(drink)}
          style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 24,
            borderWidth: 1, borderColor: category === drink ? colors.brand : colors.border,
            backgroundColor: category === drink ? colors.brandSoft : colors.card }}>
          <Text style={{ color: category === drink ? colors.brand : colors.text, fontWeight: "600" }}>{drink}</Text>
        </Pressable>)}
      </ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 16, color: colors.text, fontWeight: "700" }}>Open sessions</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Refresh sessions"
          disabled={loading} onPress={() => void refresh()} style={{ padding: 10, minHeight: layout.tapHeight }}>
          <Text style={{ color: colors.brand, fontWeight: "700" }}>Refresh</Text>
        </Pressable>
      </View>
      {loading ? <ActivityIndicator color={colors.brand} style={{ marginTop: 30 }} /> : null}
      {!loading && error ? <View style={{ borderRadius: layout.cardRadius, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, padding: 20 }}>
        <Text style={{ color: colors.text, fontWeight: "700", marginBottom: 8 }}>Can't load sessions yet</Text>
        <Text style={{ color: colors.muted, lineHeight: 22 }}>{error}</Text>
        <Text style={{ color: colors.muted, lineHeight: 22, marginTop: 8 }}>A verified account and connected Tokea API are required. Sample sessions are not shown as real users.</Text>
      </View> : null}
      {!loading && !error && visible.length === 0 ? <View style={{ borderRadius: layout.cardRadius, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, padding: 20 }}>
        <Text style={{ color: colors.text, fontWeight: "700", marginBottom: 8 }}>Nothing available yet</Text>
        <Text style={{ color: colors.muted, lineHeight: 22 }}>There are no open sessions for this filter. Try another drink or refresh.</Text>
      </View> : null}
      {!loading && !error && visible.map((session) => <SessionCard key={session.id} session={session} />)}
      <Text style={{ color: colors.muted, marginTop: 12, lineHeight: 19, fontSize: 12 }}>
        For adults 18+ only. Exact locations are never shown in Discover. Session requests will be added when verified sign-in and the join API are ready.
      </Text>
    </View>
  </ScrollView>;
}
