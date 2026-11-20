import type { ReactNode } from "react";
import { ImageBackground, Pressable, Text, View } from "react-native";
import { DRINK_PHOTOS } from "./drink-photos";
import { PersonAvatar } from "./person-avatar";
import { colors, layout } from "./theme";
import { displayCopy } from "./display-copy";
import type { NativeSession } from "./sessions";

const bannerColors:Record<string,[string,string]>={
  Beer:["#FFF6DE","#78531D"],Wine:["#FCECF3","#814563"],
  Cocktails:["#F5E9FD","#71428B"],Muratina:["#F7F1DA","#665724"],
  Whiskey:["#F9EBDC","#7F5832"],Vodka:["#E8F4FC","#44718A"],
  Gin:["#E8F5EB","#3E745C"],Rum:["#FBEEE0","#82603A"],
  Tequila:["#E6F5F4","#42796E"],Brandy:["#FCEDDE","#8A5338"],
  Spirits:["#F0ECFA","#6B5687"],Coffee:["#F3EBE3","#755B42"],
  "Soft drinks":["#E9F8FA","#367985"],Tea:["#EDF6E6","#56783F"],
};
export function Pill({selected,children,onPress}:{
  selected:boolean;children:ReactNode;onPress:()=>void;
}) {
  return <Pressable onPress={onPress} accessibilityRole="button" style={{
    borderWidth:1,borderColor:selected?colors.brand:colors.border,
    backgroundColor:selected?colors.brandSoft:colors.card,
    paddingHorizontal:14,minHeight:layout.tapHeight,borderRadius:23,
    alignItems:"center",justifyContent:"center",marginRight:8,
  }}><Text style={{fontSize:13,color:selected?colors.brand:colors.text,fontWeight:selected?"700":"500"}}>{children}</Text></Pressable>;
}
export function Action({label,onPress,secondary=false,disabled=false}:{
  label:string;onPress:()=>void;secondary?:boolean;disabled?:boolean;
}) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
    style={{backgroundColor:secondary?colors.card:colors.brand,
      borderWidth:secondary?1:0,borderColor:colors.border,borderRadius:14,minHeight:46,
      paddingHorizontal:18,alignItems:"center",justifyContent:"center",opacity:disabled?0.55:1}}>
    <Text style={{color:secondary?colors.text:"#FFFFFF",fontWeight:"700",fontSize:14}}>{label}</Text>
  </Pressable>;
}
export function SessionCard({session,onPress}:{
  session:NativeSession;onPress:()=>void;
}) {
  const [bg]=bannerColors[session.category]??[colors.brandSoft,colors.brand];
  return <Pressable onPress={onPress} accessibilityRole="button"
    accessibilityLabel={`${session.hostName}: ${session.title}, ${session.category}`}
    style={{backgroundColor:colors.card,borderWidth:1,borderColor:colors.border,
      borderRadius:layout.cardRadius,overflow:"hidden",marginBottom:layout.cardGap}}>
    <ImageBackground source={{uri:DRINK_PHOTOS[session.category]}}
      imageStyle={{resizeMode:"cover"}} style={{backgroundColor:bg,minHeight:120,justifyContent:"flex-end"}}>
      <View style={{paddingHorizontal:20,paddingVertical:18,backgroundColor:"rgba(30,25,35,0.54)"}}>
        <Text style={{fontSize:10,textTransform:"uppercase",letterSpacing:2,color:"#FFFFFF"}}>Drinks & company</Text>
        <Text style={{fontSize:21,fontWeight:"700",color:"#FFFFFF",marginTop:3}}>{session.category}</Text>
      </View>
    </ImageBackground>
    <View style={{padding:20}}>
      <View style={{flexDirection:"row",alignItems:"center",gap:11}}>
        <PersonAvatar userId={session.hostId} name={session.hostName} hasPhoto={session.hostHasPhoto}
          photoVersion={session.hostPhotoVersion} size={44}/>
        <Text style={{color:colors.text,fontSize:16,fontWeight:"700",flex:1}}>{displayCopy(session.hostName)}</Text>
      </View>
      <Text style={{color:colors.text,fontSize:15,marginTop:8,lineHeight:22}}>{displayCopy(session.title)}</Text>
      <View style={{height:1,backgroundColor:colors.border,marginVertical:14}}/>
      <Text style={{color:colors.muted,fontSize:12,lineHeight:20}}>
        {displayCopy(session.neighbourhood)} · {new Date(session.startsAt).toLocaleString("en-KE",
          {month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}
      </Text>
      <Text style={{color:colors.muted,fontSize:12,marginTop:4}}>{session.seatsLeft} seats left · View details</Text>
    </View>
  </Pressable>;
}
export function MessageBox({text}:{text:string}) {
  return <View style={{padding:16,backgroundColor:colors.brandSoft,borderRadius:18,marginBottom:16}}>
    <Text style={{fontSize:13,color:colors.text,lineHeight:20}}>{displayCopy(text)}</Text>
  </View>;
}
