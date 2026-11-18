import { useState } from "react";
import { Alert, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Heading, Screen } from "@/ui";
import { colors } from "@/theme";
import { Action, Pill } from "@/native-cards";
import { CATEGORIES, NEIGHBOURHOODS, publishSession, type Category, type Neighbourhood } from "@/sessions";

const inputStyle={minHeight:46,borderWidth:1,borderColor:colors.border,borderRadius:14,
  backgroundColor:colors.card,paddingHorizontal:14,paddingVertical:10,color:colors.text,fontSize:14} as const;
const makeDate=(days=1)=>{
  const d=new Date(Date.now()+days*86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
export default function HostScreen() {
  const [title,setTitle]=useState("");
  const [category,setCategory]=useState<Category>("Coffee");
  const [neighbourhood,setNeighbourhood]=useState<Neighbourhood>("Westlands");
  const [guestCapacity,setGuestCapacity]=useState(3);
  const [date,setDate]=useState(makeDate());
  const [time,setTime]=useState("19:00");
  const [duration,setDuration]=useState(2);
  const [busy,setBusy]=useState(false);

  async function publish() {
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)){
      Alert.alert("Check the date and time","Use YYYY-MM-DD and 24-hour HH:MM.");return;
    }
    const start=new Date(`${date}T${time}:00`);
    if(Number.isNaN(start.getTime())||start.getFullYear()!==Number(date.slice(0,4))||
      start.getMonth()+1!==Number(date.slice(5,7))||start.getDate()!==Number(date.slice(8,10))) {
      Alert.alert("Invalid date","Choose a real calendar date.");return;
    }
    const end=new Date(start.getTime()+duration*60*60*1000);
    setBusy(true);
    try {
      const created=await publishSession({
        title:title.trim(),category,neighbourhood,guestCapacity,
        startsAt:start.toISOString(),endsAt:end.toISOString(),
      });
      router.replace({pathname:"/session/[id]",params:{id:created.id}});
    } catch(e){Alert.alert("Couldn't create session",e instanceof Error?e.message:"Try again.");}
    finally{setBusy(false);}
  }
  return <Screen>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:60}}>
      <View style={{alignSelf:"flex-start",marginBottom:12}}><Action secondary label="‹  Back" onPress={()=>router.back()}/></View>
      <Heading title="Host a drink" subtitle="Create a relaxed meetup. Choose a public venue with your guests after they join."/>
      <Text style={{color:colors.text,fontWeight:"600",marginBottom:8}}>What is the plan?</Text>
      <TextInput accessibilityLabel="Session title" value={title} maxLength={140}
        onChangeText={setTitle} placeholder="A relaxed drink and good company" placeholderTextColor={colors.muted}
        style={[inputStyle,{marginBottom:22}]}/>
      <Text style={{color:colors.text,fontWeight:"600",marginBottom:10}}>Choose your drink</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",rowGap:9,marginBottom:22}}>
        {CATEGORIES.map(c=><Pill key={c} selected={category===c} onPress={()=>setCategory(c)}>{c}</Pill>)}
      </View>
      <Text style={{color:colors.text,fontWeight:"600",marginBottom:10}}>Neighbourhood (approximate)</Text>
      <View style={{flexDirection:"row",flexWrap:"wrap",rowGap:9,marginBottom:22}}>
        {NEIGHBOURHOODS.map(n=><Pill key={n} selected={neighbourhood===n} onPress={()=>setNeighbourhood(n)}>{n}</Pill>)}
      </View>
      <Text style={{color:colors.text,fontWeight:"600",marginBottom:10}}>Guest capacity</Text>
      <View style={{flexDirection:"row",marginBottom:22}}>
        {[1,2,3,4,6,10].map(n=><Pill key={n} selected={guestCapacity===n} onPress={()=>setGuestCapacity(n)}>{String(n)}</Pill>)}
      </View>
      <Text style={{color:colors.text,fontWeight:"600",marginBottom:10}}>Date and start time</Text>
      <View style={{flexDirection:"row",gap:10,marginBottom:8}}>
        <View style={{flex:2}}><TextInput accessibilityLabel="Session date" style={inputStyle}
          value={date} placeholder="YYYY-MM-DD" onChangeText={setDate} autoCapitalize="none"/></View>
        <View style={{flex:1}}><TextInput accessibilityLabel="Start time" style={inputStyle}
          value={time} placeholder="HH:MM" onChangeText={setTime} autoCapitalize="none"/></View>
      </View>
      <Text style={{color:colors.muted,fontSize:12,marginBottom:18}}>Times use your phone's local time zone.</Text>
      <Text style={{color:colors.text,fontWeight:"600",marginBottom:10}}>Duration</Text>
      <View style={{flexDirection:"row",marginBottom:25}}>
        {[1,2,3,4].map(h=><Pill key={h} selected={duration===h} onPress={()=>setDuration(h)}>{`${h} hr`}</Pill>)}
      </View>
      <Action label={busy?"Publishing…":"Publish session"} disabled={busy||title.trim().length<4} onPress={()=>void publish()}/>
      <Text style={{color:colors.muted,fontSize:12,lineHeight:19,marginTop:16}}>
        For adults 18+ only. Exact residential addresses are never published in discovery.
      </Text>
    </ScrollView>
  </Screen>;
}
