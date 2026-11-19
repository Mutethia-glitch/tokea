import { Text } from "react-native";
import { Heading, Paper, Screen } from "@/ui";
import { colors } from "@/theme";

export default function AboutScreen() {
  return <Screen>
    <Heading title="About Tokea" subtitle="A native social discovery app for adults in Kenya." />
    <Paper>
      <Text style={{ color: colors.brand, fontSize: 22, fontWeight: "700", marginBottom: 10 }}>tokea</Text>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "600", marginBottom: 8 }}>© 2026 Tokea. All rights reserved.</Text>
      <Text style={{ color: colors.muted, lineHeight: 22 }}>
        This notice covers the original application code, text and artwork owned by the respective rights holders. It does not claim exclusive rights to the word Tokea or replace trademark clearance.
      </Text>
    </Paper>
    <Paper>
      <Text style={{ color: colors.text, fontWeight: "700", marginBottom: 8 }}>Safety first</Text>
      <Text style={{ color: colors.muted, lineHeight: 22 }}>
        Meet in public places, respect boundaries, and never feel pressured to drink. Account verification and safety workflows must be complete before public launch.
      </Text>
    </Paper>
  </Screen>;
}
