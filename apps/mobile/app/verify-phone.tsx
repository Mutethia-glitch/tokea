import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { colors, layout } from "@/theme";
import { normalizeKenyanPhone, maskedKenyanPhone } from "@/phone";
import { startPhoneProof, confirmPhoneProof, type PhoneChallenge } from "@/phone-otp-api";

const inputStyle = {
  backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1,
  borderRadius: 16, minHeight: 54, paddingHorizontal: 16, color: colors.text, fontSize: 17,
} as const;

function PrimaryAction({ text, disabled, onPress }: { text: string; disabled: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={text} accessibilityState={{ disabled }}
    disabled={disabled} onPress={onPress} style={{ backgroundColor: colors.brand, opacity: disabled ? 0.5 : 1,
      minHeight: 50, borderRadius: 16, justifyContent: "center", alignItems: "center" }}>
    <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 15 }}>{text}</Text>
  </Pressable>;
}

export default function VerifyPhoneScreen() {
  const [input, setInput] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<PhoneChallenge | null>(null);
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState(0);
  const [resendAt, setResendAt] = useState(0);
  const [clock, setClock] = useState(Date.now());
  const [working, setWorking] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const normalized = normalizeKenyanPhone(input);
  const secondsRemaining = Math.max(0, Math.ceil((expiresAt - clock) / 1000));
  const resendRemaining = Math.max(0, Math.ceil((resendAt - clock) / 1000));

  async function sendCode() {
    const target = phone ?? normalized;
    if (!target || working || resendRemaining > 0) return;
    setWorking(true);
    setError(null);
    try {
      const next = await startPhoneProof(target);
      setPhone(target);
      setChallenge(next);
      setCode("");
      setVerified(false);
      setExpiresAt(Date.now() + next.expiresInSeconds * 1000);
      setResendAt(Date.now() + 60_000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to send a verification code.");
    } finally {
      setWorking(false);
    }
  }

  async function verifyCode() {
    if (!challenge || code.length !== 6 || working || secondsRemaining === 0) return;
    setWorking(true);
    setError(null);
    try {
      const result = await confirmPhoneProof(challenge.challengeId, code);
      if (result.phoneVerified !== true || result.authenticated !== false || result.ageVerified !== false) {
        throw Error("Unexpected verification response.");
      }
      setVerified(true);
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to verify the code.");
    } finally {
      setWorking(false);
    }
  }

  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}
    style={{ flex: 1, backgroundColor: colors.background }}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
      <View style={{ maxWidth: layout.maxWidth, alignSelf: "center", width: "100%",
        padding: layout.contentPadding, paddingTop: 32 }}>
        <Text style={{ fontSize: 26, fontWeight: "700", color: colors.brand, marginBottom: 24 }}>tokea</Text>
        <Text style={{ fontSize: 27, fontWeight: "700", color: colors.text, marginBottom: 8 }}>
          {verified ? "Number confirmed" : challenge ? "Enter your code" : "Verify your number"}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 22, marginBottom: 22 }}>
          {verified ? "Your phone number was verified in the SMS sandbox. Account creation and age assurance are separate."
            : challenge ? "Enter the six-digit code sent to " + maskedKenyanPhone(phone ?? "") +
                ". During development the code arrives in the Africa's Talking simulator."
              : "Enter a Kenyan mobile number to receive a one-time code in the Africa's Talking sandbox simulator."}
        </Text>

        {verified ? <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
          borderRadius: layout.cardRadius, padding: 20 }}>
          <Text style={{ color: colors.success, fontWeight: "700", marginBottom: 8 }}>Phone verified</Text>
          <Text style={{ color: colors.muted, lineHeight: 22 }}>
            This does not sign you in, establish identity or verify that you are 18+. Those checks must be finished before public launch.
          </Text>
        </View> : challenge ? <>
          <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Verification code</Text>
          <TextInput value={code} onChangeText={(v) => setCode(v.replace(/\D/g, "").slice(0, 6))}
            keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="sms-otp"
            accessibilityLabel="Six-digit verification code" maxLength={6}
            placeholder="6-digit code" placeholderTextColor={colors.muted}
            style={[inputStyle, { letterSpacing: 5 }]} />
          <Text style={{ color: colors.muted, fontSize: 13, marginVertical: 12 }}>
            {secondsRemaining ? "Expires in " + Math.floor(secondsRemaining / 60) + ":" +
              String(secondsRemaining % 60).padStart(2, "0") : "Code expired. Request another code."}
          </Text>
          <PrimaryAction text={working ? "Checking…" : "Verify code"}
            disabled={working || secondsRemaining === 0 || code.length !== 6} onPress={() => void verifyCode()} />
          <Pressable accessibilityRole="button" disabled={working || resendRemaining > 0}
            onPress={() => void sendCode()} style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: resendRemaining ? colors.muted : colors.brand, fontWeight: "700" }}>
              {resendRemaining ? "Resend available in " + resendRemaining + "s" : "Send a new code"}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={working}
            onPress={() => { setPhone(null); setChallenge(null); setCode(""); setError(null); }}
            style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: colors.brand }}>Use another number</Text>
          </Pressable>
        </> : <>
          <Text style={{ color: colors.text, fontWeight: "600", marginBottom: 8 }}>Kenyan mobile number</Text>
          <TextInput value={input} onChangeText={setInput} keyboardType="phone-pad"
            accessibilityLabel="Kenyan mobile number" placeholder="0712 345 678"
            placeholderTextColor={colors.muted} autoComplete="tel" textContentType="telephoneNumber"
            maxLength={20} style={inputStyle} />
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 10, marginBottom: 22 }}>
            Supports 07…, 01… and +254… formats.
          </Text>
          <PrimaryAction text={working ? "Sending…" : "Send verification code"}
            disabled={working || !normalized || resendRemaining > 0} onPress={() => void sendCode()} />
        </>}

        {working && <ActivityIndicator color={colors.brand} style={{ marginTop: 16 }} />}
        {error && <Text accessibilityRole="alert" style={{ color: "#A42E48", marginTop: 16, lineHeight: 21 }}>{error}</Text>}
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 30, lineHeight: 20 }}>
          For adults 18+ only. Phone verification is not age or identity verification. Never share a code.
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 22 }}>© 2026 Tokea. All rights reserved.</Text>
      </View>
    </ScrollView>
  </KeyboardAvoidingView>;
}
