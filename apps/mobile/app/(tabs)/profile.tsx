import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { getVerificationStatus, type VerificationStatus } from "@/verification";
import { Heading, Paper, Screen } from "@/ui";
import { colors } from "@/theme";
import { enablePhoneNotifications } from "@/push";

export default function ProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [verification,setVerification]=useState<VerificationStatus|null>(null);
  useFocusEffect(useCallback(()=>{
    void getVerificationStatus().then(setVerification).catch(()=>setVerification(null));
  },[]));
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
      <Text style={{color:colors.text,fontSize:16,fontWeight:"700"}}>Age verification</Text>
      <Text style={{color:verification?.verified?colors.success:colors.muted,
        fontSize:13,marginTop:9,marginBottom:13,lineHeight:20}}>
        {verification?.verified?"Verified — you can host and join sessions.":
          verification?.status==="pending"?"Under review — you can browse while the support team reviews your photos.":
          verification?.status==="declined"?"Not approved — you may upload clearer photos in a new submission.":
          "Verify your age with a clear ID photo and selfie before hosting or joining."}
      </Text>
      <Pressable accessibilityRole="button" onPress={()=>router.push("/verification")}
        style={{minHeight:44,justifyContent:"center"}}>
        <Text style={{color:colors.brand,fontWeight:"700"}}>
          {verification?.verified?"View verification status":
            verification?.status==="pending"?"Check review progress":"Verify my age"}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={()=>router.push("/privacy")}
        style={{minHeight:44,justifyContent:"center"}}>
        <Text style={{color:colors.muted,fontWeight:"600"}}>Privacy Policy</Text>
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
    <View style={{ marginTop: 5 }}><Text style={{ color: colors.muted, fontSize: 13 }}>For adults 18+ only</Text></View>
  </Screen>;
}
