import { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { getAccessToken } from "./api";
import { colors } from "./theme";

export function PersonAvatar({userId,name,hasPhoto=false,photoVersion,localUri,size=44}:{
 userId:string;name:string;hasPhoto?:boolean;photoVersion?:string|null;localUri?:string|null;size?:number;
}){
  const [access,setAccess]=useState<string|null>(null);
  const [broken,setBroken]=useState(false);
  useEffect(()=>{setBroken(false);if(hasPhoto)void getAccessToken().then(setAccess);},
    [userId,hasPhoto,photoVersion]);
  const base=process.env.EXPO_PUBLIC_API_URL;
  const url=base&&hasPhoto&&access&&!broken
    ?base+"/v1/users/"+encodeURIComponent(userId)+"/photo?v="+encodeURIComponent(photoVersion??"1")
    :null;
  const source=localUri?{uri:localUri}:url?{uri:url,headers:{Authorization:"Bearer "+access}}:null;
  const initials=name.trim().split(/\s+/).slice(0,2).map(x=>x[0]?.toUpperCase()??"").join("")||"T";
  return <View style={{width:size,height:size,borderRadius:size/2,overflow:"hidden",
    borderWidth:1,borderColor:colors.border,backgroundColor:colors.brandSoft,
    alignItems:"center",justifyContent:"center"}}>
    {source?<Image source={source} resizeMode="cover" onError={()=>setBroken(true)}
      style={{width:size,height:size}}/>:
      <Text style={{fontWeight:"700",fontSize:size*0.33,color:colors.brand}}>{initials}</Text>}
  </View>;
}
