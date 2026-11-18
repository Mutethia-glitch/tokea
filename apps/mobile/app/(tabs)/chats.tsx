import { Text } from "react-native";
import { Heading, Paper, Screen } from "@/ui";
import { colors } from "@/theme";

export default function ChatsScreen() {
  return <Screen>
    <Heading title="Chats" subtitle="Private conversations with the people in your confirmed sessions." />
    <Paper>
      <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Chat opens after approval</Text>
      <Text style={{ color: colors.muted, lineHeight: 21 }}>
        Messaging will require an active authenticated account and a verified session membership. The server will enforce this before delivering messages.
      </Text>
    </Paper>
  </Screen>;
}
