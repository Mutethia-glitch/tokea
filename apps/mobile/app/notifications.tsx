import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";
import { router } from "expo-router";
import { fetchInbox, markNotificationRead, type InboxItem } from "@/api";
import { colors, layout } from "@/theme";

export default function NotificationsScreen() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setItems(await fetchInbox()); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to load notifications."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function openItem(item: InboxItem) {
    try { await markNotificationRead(item.id); }
    catch { /* Stay in inbox even when marking as read fails. */ }
    setItems((current) => current.map((n) => n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n));
    // Never navigate to an arbitrary destination received from server/push data.
    if (item.route === "/verification") {
      router.push("/verification");
    } else if (item.route === "/requests") {
      router.push("/(tabs)/requests");
    } else {
      const chat = /^\/chats\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.exec(item.route);
      if (chat?.[1]) router.push({ pathname: "/chats/[id]", params: { id: chat[1] } });
    }
  }

  return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: layout.maxWidth, width: "100%", alignSelf: "center", flexGrow: 1 }}
      data={items}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.brand} />}
      ListEmptyComponent={loading ? <ActivityIndicator color={colors.brand} /> :
        <Text style={{ color: colors.muted, marginTop: 20, lineHeight: 23 }}>{error ?? "No notifications yet."}</Text>}
      renderItem={({ item }) => <Pressable onPress={() => void openItem(item)}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}: ${item.body}`}
        style={{ backgroundColor: colors.card, padding: 18, borderWidth: 1, borderColor: colors.border,
          borderRadius: 20, marginBottom: 12, opacity: item.readAt ? 0.7 : 1 }}>
        <Text style={{ color: colors.text, fontWeight: item.readAt ? "500" : "700", fontSize: 16 }}>{item.title}</Text>
        <Text style={{ color: colors.muted, marginTop: 6, lineHeight: 20 }}>{item.body}</Text>
        <Text style={{ color: colors.muted, marginTop: 7, fontSize: 12 }}>{new Date(item.createdAt).toLocaleString()}</Text>
      </Pressable>}
    />
  </View>;
}
