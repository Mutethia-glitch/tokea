import { Text, View } from "react-native";
import type { DiscoverSession } from "./api";
import { colors, layout } from "./theme";

/** Native translation of the approved session cards in src/components/tokea/bits.tsx. */
const categoryVisuals: Record<string, { background: string; foreground: string; detail: string }> = {
  Beer: { background: "#F9EAC7", foreground: "#775013", detail: "Easy conversations" },
  Wine: { background: "#F7E4EE", foreground: "#85375E", detail: "Good company" },
  Cocktails: { background: "#FBE9DF", foreground: "#8B4B38", detail: "Catch up together" },
  Coffee: { background: "#F0E6DB", foreground: "#654C38", detail: "Coffee and conversation" },
  "Soft drinks": { background: "#E3F3EE", foreground: "#296851", detail: "Good company, your way" },
  Tea: { background: "#E8F0DB", foreground: "#4B673B", detail: "Slow down together" },
  Muratina: { background: "#F5E7CC", foreground: "#705521", detail: "Local traditions, good company" },
  Whiskey: { background: "#F5E6D0", foreground: "#755027", detail: "Easy conversations" },
  Vodka: { background: "#E7EDF8", foreground: "#3F5A86", detail: "Make new connections" },
  Gin: { background: "#E3F0EA", foreground: "#36665D", detail: "Meet for a chat" },
  Rum: { background: "#F7E6D5", foreground: "#845331", detail: "Stay for the company" },
  Tequila: { background: "#E3F5EC", foreground: "#306C61", detail: "Catch up together" },
  Brandy: { background: "#F6E5DF", foreground: "#814E42", detail: "Slow conversations" },
  Spirits: { background: "#F0E8F9", foreground: "#664C91", detail: "Your choice, your company" },
};

function displayWhen(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Time to be confirmed" :
    date.toLocaleString("en-KE", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function SessionCard({ session }: { session: DiscoverSession }) {
  const visual = categoryVisuals[session.category] ?? { background: colors.brandSoft, foreground: colors.brand, detail: "Meet for a chat" };
  const initials = session.hostName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "T";
  return <View style={{ overflow: "hidden", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: layout.cardRadius, marginBottom: layout.cardGap }}>
    <View style={{ height: 80, backgroundColor: visual.background, justifyContent: "center", paddingHorizontal: 20 }}>
      <Text style={{ color: visual.foreground, fontSize: 10, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" }}>Drinks & company</Text>
      <Text style={{ color: visual.foreground, fontSize: 19, fontWeight: "700", marginTop: 3 }}>{session.category}</Text>
      <Text style={{ color: visual.foreground, fontSize: 12, opacity: 0.8, marginTop: 2 }}>{visual.detail}</Text>
      <View pointerEvents="none" style={{ position: "absolute", right: -19, top: -55, width: 165, height: 165,
        borderWidth: 1, borderColor: visual.foreground, opacity: 0.12, borderRadius: 90 }} />
      <View pointerEvents="none" style={{ position: "absolute", right: 1, top: -27, width: 120, height: 120,
        borderWidth: 1, borderColor: visual.foreground, opacity: 0.12, borderRadius: 70 }} />
    </View>
    <View style={{ padding: 20, minHeight: 224, justifyContent: "space-between" }}>
      <View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.brandSoft,
            justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: colors.brand, fontSize: 15, fontWeight: "700" }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: "700" }}>
              {session.isHost ? "Your session" : session.hostName}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>{session.category}</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.success, backgroundColor: "#E9F5EE",
            paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, overflow: "hidden" }}>
            {session.seatsRemaining > 0 ? "Open" : "Full"}
          </Text>
        </View>
        <Text style={{ marginTop: 16, color: colors.text, fontSize: 15, lineHeight: 24 }}>{session.title}</Text>
      </View>
      <View style={{ borderTopColor: colors.border, borderTopWidth: 1, paddingTop: 12, marginTop: 16 }}>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 21 }}>{session.neighbourhood} · {displayWhen(session.startsAt)}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>{session.isHost ? "You're hosting" : session.seatsRemaining + " seats remaining"}</Text>
      </View>
    </View>
  </View>;
}
