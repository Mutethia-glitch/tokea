import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Heading, Screen } from "@/ui";
import { colors } from "@/theme";
import { Action, MessageBox, Pill, SessionCard } from "@/native-cards";
import { CATEGORIES, listSessions, type Category, type NativeSession } from "@/sessions";
import { getAccessToken } from "@/api";
import { getVerificationStatus, type VerificationStatus } from "@/verification";

export default function DiscoverScreen() {
  const [category,setCategory]=useState<Category|undefined>(undefined);
  const [sessions,setSessions]=useState<NativeSession[]>([]);
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [verification,setVerification]=useState<VerificationStatus|null>(null);
  const [signedIn,setSignedIn]=useState(false);
  const refresh=useCallback(async()=>{
    setBusy(true);setError(null);
    try {setSessions((await listSessions(category)).sessions);}
    catch(e) {setSessions([]);setError(e instanceof Error?e.message:"Unable to load sessions.");}
    finally {setBusy(false);}
  },[category]);
  useFocusEffect(useCallback(()=>{
    void getAccessToken().then(t=>setSignedIn(!!t));
    void refresh();
    void getVerificationStatus().then(setVerification).catch(()=>setVerification(null));
  },[refresh]));

  return <Screen>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:48}}>
      <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:24,gap:12}}>
        <Text style={{fontSize:27,color:colors.brand,fontWeight:"700"}}>tokea</Text>
        <Pressable onPress={()=>router.push("/notifications")} accessibilityRole="button" accessibilityLabel="Open notifications"
          style={{borderColor:colors.border,borderWidth:1,borderRadius:30,minHeight:44,paddingHorizontal:12,justifyContent:"center"}}>
          <Text style={{color:colors.text,fontSize:12}}>Notifications</Text>
        </Pressable>
      </View>
      <Heading title="Who's out nearby?" subtitle="Find your people. Share a drink at a public place." />
      <View style={{alignSelf:"flex-start",marginBottom:20}}>
        <Action label="＋  Host a drink"
          onPress={()=>router.push(!signedIn?"/sign-in":verification?.verified?"/host":"/verification")}/>
      </View>
      {!signedIn?<View style={{marginBottom:15}}>
        <MessageBox text="Welcome to Tokea! Sign in to see people hosting drinks and set up your profile."/>
        <Action label="Sign in with phone" onPress={()=>router.push("/sign-in")}/>
      </View>:null}
      {verification&&!verification.verified?<MessageBox text="Browse freely while your age is being verified. To host or request to join, upload your ID and a clear selfie in Profile."/>:null}
      <Text style={{fontWeight:"600",color:colors.text,marginBottom:10,fontSize:13}}>Drinks</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:20}}>
        <Pill selected={!category} onPress={()=>setCategory(undefined)}>All</Pill>
        {CATEGORIES.map(c=><Pill key={c} selected={category===c} onPress={()=>setCategory(c)}>{c}</Pill>)}
      </ScrollView>
      {busy?<ActivityIndicator color={colors.brand} style={{marginTop:25}}/>:null}
      {error?<MessageBox text={error}/>:null}
      {!busy&&!error&&sessions.length===0?<MessageBox text="No sessions match this filter yet. You can create one."/>:null}
      {sessions.map(s=><SessionCard key={s.id} session={s} onPress={()=>router.push({pathname:"/session/[id]",params:{id:s.id}})}/>)}
      <Text style={{color:colors.muted,fontSize:12,lineHeight:19,marginTop:10}}>Approximate neighbourhoods only. Exact locations are not shown.</Text>
      <Text style={{color:colors.muted,fontSize:12,marginTop:10}}>For adults 18+ only</Text>
    </ScrollView>
  </Screen>;
}
