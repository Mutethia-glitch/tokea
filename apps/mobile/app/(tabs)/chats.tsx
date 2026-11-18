import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Heading, Paper, Screen } from "@/ui";
import { colors } from "@/theme";
import { Action, MessageBox } from "@/native-cards";
import { listRequests, type NativeRequest } from "@/sessions";

export default function ChatsScreen() {
  const [chats,setChats]=useState<NativeRequest[]>([]);
  const [busy,setBusy]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const load=useCallback(async()=>{
    setBusy(true);setError(null);
    try {
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
    {error?<MessageBox text={error}/>:null}
    {!busy&&!error&&chats.length===0?<MessageBox text="When a host accepts a join request, its private chat appears here."/>:null}
    {chats.map(item=><Paper key={item.sessionId}>
      <Text style={{fontWeight:"700",fontSize:15,color:colors.text}}>{item.title}</Text>
      <Text style={{fontSize:12,color:colors.muted,marginTop:8,marginBottom:14}}>
        {item.category} · {item.neighbourhood} · Approved members only
      </Text>
      <Action label="Open chat" onPress={()=>router.push({pathname:"/chats/[id]",params:{id:item.sessionId}})}/>
    </Paper>)}
  </ScrollView></Screen>;
}
