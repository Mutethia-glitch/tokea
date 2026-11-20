import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { useEffect } from "react";
import { getAccessToken } from "@/api";
import { TokeaLogo, displaySerif } from "@/branding";
import { Screen } from "@/ui";
import { colors } from "@/theme";

/** Real onboarding mirrors checked-in preview; no fake demo-account bypass. */
export default function WelcomeScreen(){
  useEffect(()=>{let active=true;void getAccessToken().then(t=>{if(active&&t)router.replace("/(tabs)");});return()=>{active=false;};},[]);
  return <Screen><ScrollView showsVerticalScrollIndicator={false}
    contentContainerStyle={{flexGrow:1,paddingTop:20,paddingBottom:42}}>
    <TokeaLogo/>
    <View style={{flexGrow:1,justifyContent:"center",paddingTop:38,paddingBottom:30}}>
      <Text style={{fontFamily:displaySerif,fontSize:45,lineHeight:52,letterSpacing:-0.8,color:colors.text}}>Find your people.</Text>
      <Text style={{fontFamily:displaySerif,fontSize:45,lineHeight:52,letterSpacing:-0.8,color:colors.brand}}>Share a drink.</Text>
      <Text style={{color:colors.muted,fontSize:16,lineHeight:27,marginTop:18}}>
        See who's out for a casual drink nearby, ask to join, and meet somewhere public.
      </Text>
      <View style={{marginTop:38,borderWidth:1,borderColor:colors.border,
        backgroundColor:colors.card,borderRadius:27,padding:20}}>
        <Text style={{fontSize:15,fontWeight:"600",color:colors.text}}>For adults 18+ only</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Get started"
        onPress={()=>router.push("/sign-in")}
        style={{backgroundColor:colors.brand,minHeight:60,borderRadius:32,
          alignItems:"center",justifyContent:"center",marginTop:39}}>
        <Text style={{fontSize:18,fontWeight:"600",color:"#FFFFFF"}}>Get started  →</Text>
      </Pressable>
    </View>
  </ScrollView></Screen>;
}
