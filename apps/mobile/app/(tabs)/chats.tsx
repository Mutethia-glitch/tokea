import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Heading, Paper, Screen } from "@/ui";
import { colors } from "@/theme";
import { displayCopy } from "@/display-copy";
import { Action, MessageBox } from "@/native-cards";
import { listRequests, type NativeRequest } from "@/sessions";
import { getVerificationStatus } from "@/verification";

export default function ChatsScreen() {
  const [chats,setChats]=useState<NativeRequest[]>([]);
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [needsVerification,setNeedsVerification]=useState(false);
  const load=useCallback(async()=>{
    setBusy(true);setError(null);
    try {
      const status=await getVerificationStatus();
      setNeedsVerification(!status.verified);
      if(!status.verified){setChats([]);return;}
      const r=await listRequests();
      const unique=new Map<string,NativeRequest>();
      for(const item of [...r.incoming,...r.sent]) {
        if(item.status==="accepted"&&!unique.has(item.sessionId))unique.set(item.sessionId,item);
      }
      setChats([...unique.values()]);
    }catch(e){setChats([]);setError(e instanceof Error?e.message:"Unable to load chats.");}
    finally {setBusy(false);}
  },[]);
  useFocusEffect(useCallback(()=>{void load();},[load]));
  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:50}}>
    <Heading title="Chats" subtitle="Private conversations for sessions you host or have been accepted into."/>
    {busy?<ActivityIndicator color={colors.brand}/>:null}
    {needsVerification?<Paper>
      <Text style={{color:colors.text,fontWeight:"700",fontSize:16,marginBottom:8}}>Chats open after approval</Text>
      <Text style={{color:colors.muted,lineHeight:21,marginBottom:16}}>You can keep exploring Tokea while your photos are being reviewed. Once approved, you can join sessions and chat with your group.</Text>
      <Action label="Check age verification" onPress={()=>router.push("/verification")}/>
    </Paper>:null}
    {error?<MessageBox text={error}/>:null}
    {!busy&&!error&&!needsVerification&&chats.length===0?<MessageBox text="When a host accepts a join request, its private chat appears here."/>:null}
    {chats.map(item=><Paper key={item.sessionId}>
      <Text style={{fontWeight:"700",fontSize:15,color:colors.text}}>{displayCopy(item.title)}</Text>
      <Text style={{fontSize:12,color:colors.muted,marginTop:8,marginBottom:14}}>
        {displayCopy(item.category)} · {displayCopy(item.neighbourhood)} · Approved members only
      </Text>
      <Action label="Open chat" onPress={()=>router.push({pathname:"/chats/[id]",params:{id:item.sessionId}})}/>
    </Paper>)}
  </ScrollView></Screen>;
}
