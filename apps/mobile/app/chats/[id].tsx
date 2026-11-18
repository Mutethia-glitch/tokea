import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Action, MessageBox } from "@/native-cards";
import { colors, layout } from "@/theme";
import { listMessages, sendMessage, type NativeMessage } from "@/sessions";

export default function SessionChat() {
  const {id}=useLocalSearchParams<{id:string}>();
  const [messages,setMessages]=useState<NativeMessage[]>([]);
  const [input,setInput]=useState("");
  const [error,setError]=useState<string|null>(null);
  const [busy,setBusy]=useState(true);
  const [sending,setSending]=useState(false);
  const refresh=useCallback(async()=>{
    if(!id)return;
    try {setMessages(await listMessages(id));setError(null);}
    catch(e){setError(e instanceof Error?e.message:"Unable to open this chat.");}
    finally{setBusy(false);}
  },[id]);
  useFocusEffect(useCallback(()=>{
    setBusy(true);void refresh();
    const interval=setInterval(()=>void refresh(),10_000);
    return()=>clearInterval(interval);
  },[refresh]));
  async function submit(){
    if(!id||!input.trim())return;
    setSending(true);
    try{
      await sendMessage(id,input.trim());
      setInput("");
      await refresh();
    }catch(e){setError(e instanceof Error?e.message:"Unable to send message.");}
    finally{setSending(false);}
  }
  return <KeyboardAvoidingView style={{flex:1,backgroundColor:colors.background}} behavior={Platform.OS==="ios"?"padding":undefined}>
    <View style={{width:"100%",maxWidth:layout.maxWidth,alignSelf:"center",flex:1,paddingHorizontal:20}}>
      <View style={{paddingVertical:12,alignSelf:"flex-start"}}>
        <Action secondary label="‹  Back to chats" onPress={()=>router.back()}/>
      </View>
      <Text style={{color:colors.text,fontWeight:"700",fontSize:23,marginBottom:4}}>Session chat</Text>
      <Text style={{color:colors.muted,fontSize:12,marginBottom:13}}>
        Approved participants only. Keep meetups at public venues.
      </Text>
      {busy?<ActivityIndicator color={colors.brand}/>:null}
      {error?<MessageBox text={error}/>:null}
      <FlatList
        data={messages} keyExtractor={item=>item.id}
        style={{flex:1}}
        contentContainerStyle={{paddingVertical:12,gap:10}}
        ListEmptyComponent={!busy&&!error?<Text style={{color:colors.muted}}>Say hello to your group.</Text>:undefined}
        renderItem={({item})=><View style={{alignSelf:"flex-start",maxWidth:"95%",backgroundColor:colors.card,
          borderWidth:1,borderColor:colors.border,padding:15,borderRadius:18}}>
          <Text style={{color:colors.brand,fontWeight:"700",fontSize:12}}>{item.authorName}</Text>
          <Text style={{color:colors.text,marginTop:6,fontSize:14,lineHeight:21}}>{item.text}</Text>
          <Text style={{fontSize:11,color:colors.muted,marginTop:8}}>
            {new Date(item.createdAt).toLocaleTimeString("en-KE",{hour:"numeric",minute:"2-digit"})}
          </Text>
        </View>}/>
      <View style={{flexDirection:"row",alignItems:"center",gap:10,paddingVertical:12}}>
        <TextInput accessibilityLabel="Message" value={input} onChangeText={setInput}
          placeholder="Write a message…" placeholderTextColor={colors.muted} maxLength={500}
          style={{flex:1,minHeight:46,borderWidth:1,borderColor:colors.border,borderRadius:16,
            backgroundColor:colors.card,color:colors.text,paddingHorizontal:14}}/>
        <Action label={sending?"…":"Send"} onPress={()=>void submit()} disabled={sending||!input.trim()||!!error}/>
      </View>
    </View>
  </KeyboardAvoidingView>;
}
