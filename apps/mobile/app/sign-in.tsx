import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Heading, Screen } from "@/ui";
import { Action, MessageBox } from "@/native-cards";
import { colors } from "@/theme";
import { completeLogin, normalizeKenyanPhone, requestLoginCode } from "@/phone-login";

export default function SignInScreen(){
  const [phone,setPhone]=useState("");
  const [code,setCode]=useState("");
  const [stage,setStage]=useState<"phone"|"code">("phone");
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  async function request(){
    try{
      normalizeKenyanPhone(phone);
      setBusy(true);setError(null);
      await requestLoginCode(phone);
      setStage("code");
    }catch(e){setError(e instanceof Error?e.message:"Unable to send a code.");}
    finally{setBusy(false);}
  }
  async function verify(){
    try{
      setBusy(true);setError(null);
      const result=await completeLogin(phone,code);
      if(result.ageVerified)router.replace("/(tabs)");
      else {
        Alert.alert("Welcome to Tokea","You can explore now. Verify your age to host or join drinks.");
        router.replace("/verification");
      }
    }catch(e){setError(e instanceof Error?e.message:"Unable to sign in.");}
    finally{setBusy(false);}
  }
  return <Screen><KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==="ios"?"padding":undefined}>
    <ScrollView contentContainerStyle={{paddingBottom:56}}>
      <View style={{alignSelf:"flex-start",marginBottom:16}}>
        <Action secondary label="‹  Back" onPress={()=>stage==="code"?setStage("phone"):router.back()}/>
      </View>
      <Heading title={stage==="phone"?"Welcome to Tokea":"Enter your sign-in code"}
        subtitle={stage==="phone"?"Find your people. Share a drink. Sign in with your Kenyan mobile number.":
          "We sent a six-digit code to your phone. It expires in five minutes."}/>
      {error?<MessageBox text={error}/>:null}
      {stage==="phone"?<>
        <Text style={{color:colors.text,fontWeight:"700",marginBottom:9}}>Mobile phone number</Text>
        <TextInput style={{minHeight:52,borderColor:colors.border,borderWidth:1,borderRadius:14,paddingHorizontal:14,
          backgroundColor:colors.card,color:colors.text,marginBottom:18,fontSize:16}}
          keyboardType="phone-pad" autoComplete="tel" placeholder="0712 345 678" placeholderTextColor={colors.muted}
          accessibilityLabel="Kenyan mobile number" value={phone} onChangeText={setPhone} maxLength={20}/>
        <Action label={busy?"Sending code…":"Send me a code"} disabled={busy||phone.trim().length<10}
          onPress={()=>void request()}/>
      </>:<>
        <Text style={{color:colors.text,fontWeight:"700",marginBottom:9}}>Your six-digit code</Text>
        <TextInput accessibilityLabel="Six-digit sign-in code" value={code}
          onChangeText={setCode} maxLength={6} keyboardType="number-pad"
          autoComplete="sms-otp" placeholder="000000" placeholderTextColor={colors.muted}
          style={{minHeight:56,borderColor:colors.border,borderWidth:1,borderRadius:14,
            backgroundColor:colors.card,color:colors.text,paddingHorizontal:18,
            fontSize:24,letterSpacing:7,marginBottom:16}}/>
        <Action label={busy?"Checking…":"Continue"} onPress={()=>void verify()}
          disabled={busy||!/^[0-9]{6}$/.test(code)}/>
        <View style={{marginTop:12}}><Action secondary label="Get another code"
          disabled={busy} onPress={()=>void request()}/></View>
      </>}
      <Text style={{color:colors.muted,fontSize:12,lineHeight:20,marginTop:25}}>
        For adults 18+ only. You can browse before age verification, but must be approved before hosting or joining.
      </Text>
    </ScrollView>
  </KeyboardAvoidingView></Screen>;
}
