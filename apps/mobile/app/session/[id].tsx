import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Heading, Screen } from "@/ui";
import { colors } from "@/theme";
import { displayCopy } from "@/display-copy";
import { Action, MessageBox, Pill } from "@/native-cards";
import { listRequests, loadSession, requestToJoin, type NativeRequest, type NativeSession } from "@/sessions";
import { getVerificationStatus } from "@/verification";

export default function SessionDetailsScreen() {
  const {id}=useLocalSearchParams<{id:string}>();
  const [session,setSession]=useState<NativeSession|null>(null);
  const [existing,setExisting]=useState<NativeRequest|null>(null);
  const [isHost,setIsHost]=useState(false);
  const [verified,setVerified]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [busy,setBusy]=useState(true);
  const [sending,setSending]=useState(false);
  const [partySize,setPartySize]=useState(1);
  const [intro,setIntro]=useState("");
  const load=useCallback(async()=>{
    if(!id)return;
    setBusy(true);setError(null);
    try{
      const [s,status]=await Promise.all([loadSession(id),getVerificationStatus()]);
      setSession(s);setVerified(status.verified);
      if(status.verified){
        const r=await listRequests();
        const sent=r.sent.find(x=>x.sessionId===id&&(x.status==="pending"||x.status==="accepted"));
        setExisting(sent??null);
      }else setExisting(null);
      setIsHost(s.isHost);
    }catch(e){setError(e instanceof Error?e.message:"Unable to load session.");}
    finally{setBusy(false);}
  },[id]);
  useFocusEffect(useCallback(()=>{void load();},[load]));
  async function join(){
    if(!id)return;
    setSending(true);
    try{
      await requestToJoin(id,partySize,intro.trim());
      Alert.alert("Request sent","The host will receive your request. You'll be notified when they decide.");
      await load();
    }catch(e){Alert.alert("Unable to request",e instanceof Error?e.message:"Try again.");}
    finally{setSending(false);}
  }
  return <Screen>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:55}}>
      <View style={{alignSelf:"flex-start",marginBottom:14}}><Action label="‹  Back" secondary onPress={()=>router.back()}/></View>
      {busy?<ActivityIndicator color={colors.brand}/>:null}
      {error?<MessageBox text={error}/>:null}
      {session?<><Heading title={session.title} subtitle={`${displayCopy(session.category)} · ${displayCopy(session.neighbourhood)}`}/>
        <View style={{backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,borderRadius:24,padding:20,marginBottom:18}}>
          <Text style={{color:colors.text,fontSize:16,fontWeight:"700"}}>Hosted by {displayCopy(session.hostName)}</Text>
          <Text style={{color:colors.muted,marginTop:10,fontSize:13}}>Starts {new Date(session.startsAt).toLocaleString("en-KE")}</Text>
          <Text style={{color:colors.muted,marginTop:6,fontSize:13}}>{session.seatsLeft} of {session.guestCapacity} guest seats left</Text>
          <Text style={{color:colors.muted,marginTop:12,lineHeight:20,fontSize:13}}>
            Exact meeting points are shared privately after confirmation. Choose a safe public venue.
          </Text>
        </View>
        {!verified?<View><MessageBox text="You can view this session while age verification is pending. Host, join requests and private chat unlock only after approval."/>
          <Action label="Verify age to join" onPress={()=>router.push("/verification")}/></View>:
        existing?.status==="accepted"||isHost?<Action label="Open private chat"
          onPress={()=>router.push({pathname:"/chats/[id]",params:{id:session.id}})}/>:
        existing?.status==="pending"?<MessageBox text="Your request is pending. You'll get an in-app update when the host responds."/>:
        session.seatsLeft===0?<MessageBox text="This session is full."/>:
        <View>
          <Text style={{color:colors.text,fontWeight:"600",marginBottom:10}}>How many people are joining?</Text>
          <View style={{flexDirection:"row",marginBottom:18}}>
            {[1,2,3,4].filter(n=>n<=session.seatsLeft).map(n=>
              <Pill key={n} selected={partySize===n} onPress={()=>setPartySize(n)}>{String(n)}</Pill>)}
          </View>
          <Text style={{color:colors.text,fontWeight:"600",marginBottom:10}}>Say hello (optional)</Text>
          <TextInput accessibilityLabel="Introduction" value={intro} onChangeText={setIntro}
            maxLength={300} multiline placeholder="Hi! I'd like to join…" placeholderTextColor={colors.muted}
            style={{minHeight:90,borderWidth:1,borderColor:colors.border,borderRadius:15,
              color:colors.text,padding:13,backgroundColor:colors.card,marginBottom:18,textAlignVertical:"top"}}/>
          <Action label={sending?"Sending…":"Request to join"} disabled={sending||partySize>session.seatsLeft} onPress={()=>void join()}/>
        </View>}
      </>:null}
    </ScrollView>
  </Screen>;
}
