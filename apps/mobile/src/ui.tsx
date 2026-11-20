import type { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, layout } from "./theme";
import { displayCopy } from "./display-copy";

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}><View style={styles.content}>{children}</View></View>;
}

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  return <View style={{ marginBottom: 20 }}>
    <Text style={styles.title}>{displayCopy(title)}</Text>
    {subtitle ? <Text style={styles.subtitle}>{displayCopy(subtitle)}</Text> : null}
  </View>;
}

export function Paper({ children }: { children: ReactNode }) {
  return <View style={styles.paper}>{children}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { width: "100%", maxWidth: layout.maxWidth, alignSelf: "center", flex: 1, padding: 20 },
  title: { fontSize: 27, fontWeight: "700", color: colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 21 },
  paper: { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: layout.cardRadius, padding: 20, marginBottom: layout.cardGap },
});
