import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Heading, Paper, Screen } from "@/ui";
import { colors } from "@/theme";
import { Action, MessageBox, Pill } from "@/native-cards";
import { cancelRequest, decideRequest, listRequests, type NativeRequest } from "@/sessions";

export default function RequestsScreen() {
  const [tab,setTab]=useState<"incoming"|"sent">("incoming");
  const [incoming,setIncoming]=useState<NativeRequest[]>([]);
  const [sent,setSent]=useState<NativeRequest[]>([]);
  const [busy,setBusy]=useState(true);
  const [sending,setSending]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);

  const load=useCallback(async()=>{
    setBusy(true);setError(null);
    try {
      const data=await listRequests();
      setIncoming(data.incoming);setSent(data.sent);
    } catch(e){setIncoming([]);setSent([]);setError(e instanceof Error?e.message:"Unable to load invitations.");}
    finally{setBusy(false);}
  },[]);
  useFocusEffect(useCallback(()=>{void load();},[load]));
  async function act(r:NativeRequest,action:"accepted"|"declined"|"cancelled") {
    setSending(r.id);setError(null);
    try {
      if(action==="cancelled")await cancelRequest(r.id);
      else await decideRequest(r.sessionId,r.id,action);
      await load();
    } catch(e){setError(e instanceof Error?e.message:"Could not update this request.");}
    finally{setSending(null);}
  }
  const records=tab==="incoming"?incoming:sent;
  return <Screen>
    <ScrollView contentContainerStyle={{paddingBottom:48}} showsVerticalScrollIndicator={false}>
      <Heading title="Requests" subtitle="Approve requests to join your sessions and track invitations you've sent."/>
      <View style={{flexDirection:"row",marginBottom:20}}>
        <Pill selected={tab==="incoming"} onPress={()=>setTab("incoming")}>Incoming ({incoming.length})</Pill>
        <Pill selected={tab==="sent"} onPress={()=>setTab("sent")}>Sent ({sent.length})</Pill>
      </View>
      {busy?<ActivityIndicator color={colors.brand}/>:null}
      {error?<MessageBox text={error}/>:null}
      {!busy&&!error&&records.length===0?<MessageBox text={tab==="incoming"?"No incoming requests yet.":"You haven't requested to join a session yet."}/>:null}
      {records.map(r=><Paper key={r.id}>
        <Text style={{fontWeight:"700",fontSize:15,color:colors.text}}>{r.title}</Text>
        <Text style={{color:colors.muted,fontSize:12,marginTop:5}}>
          {r.category} · {r.neighbourhood} · {r.partySize} {r.partySize===1?"person":"people"}
        </Text>
        <Text style={{color:colors.text,marginTop:12,fontSize:14}}>
          {tab==="incoming"?`${r.applicantName} wants to join`:`Hosted by ${r.hostName}`}
        </Text>
        {r.intro?<Text style={{color:colors.muted,marginTop:6,fontSize:13}}>{r.intro}</Text>:null}
        <Text style={{fontSize:12,color:r.status==="accepted"?colors.success:colors.muted,
          fontWeight:"700",marginTop:10,textTransform:"capitalize"}}>{r.status}</Text>
        {r.status==="pending"&&tab==="incoming"?<View style={{marginTop:14,flexDirection:"row",gap:10}}>
          <View style={{flex:1}}><Action label="Accept" disabled={sending===r.id} onPress={()=>void act(r,"accepted")}/></View>
          <View style={{flex:1}}><Action label="Decline" secondary disabled={sending===r.id} onPress={()=>void act(r,"declined")}/></View>
        </View>:null}
        {r.status==="pending"&&tab==="sent"?<View style={{marginTop:14}}>
          <Action label="Cancel request" secondary disabled={sending===r.id} onPress={()=>void act(r,"cancelled")}/>
        </View>:null}
        {r.status==="accepted"?<View style={{marginTop:14}}>
          <Action label="Open private chat" onPress={()=>router.push({pathname:"/chats/[id]",params:{id:r.sessionId}})}/>
        </View>:null}
      </Paper>)}
    </ScrollView>
  </Screen>;
}
