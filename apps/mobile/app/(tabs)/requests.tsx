import { Text } from "react-native";
import { Heading, Paper, Screen } from "@/ui";
import { colors } from "@/theme";

export default function RequestsScreen() {
  return <Screen>
    <Heading title="Requests" subtitle="Manage the people who ask to join your session, and see updates on invitations you've sent." />
    <Paper>
      <Text style={{ fontWeight: "600", color: colors.text, marginBottom: 8 }}>Secure invitations</Text>
      <Text style={{ color: colors.muted, lineHeight: 21 }}>
        When account authentication and live sessions are connected, hosts will approve or decline requests through the API. Every decision will create an in-app update and an optional phone notification.
      </Text>
    </Paper>
  </Screen>;
}
