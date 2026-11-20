import { Platform, Text, View } from "react-native";
import { colors } from "./theme";

// Paired-glass mark adapted from the approved web Logo in src/components/tokea/bits.tsx.
export const displaySerif=Platform.OS==="ios"?"Georgia":"serif";
function Glass({x,y}:{x:number;y:number}){
  return <View style={{position:"absolute",left:x,top:y,width:12,height:14,borderWidth:1.8,
    borderColor:colors.brand,borderBottomLeftRadius:5,borderBottomRightRadius:5}}>
    <View style={{position:"absolute",left:4.5,top:12,width:1.8,height:10,backgroundColor:colors.brand}}/>
    <View style={{position:"absolute",left:2,top:22,width:8,height:1.8,backgroundColor:colors.brand}}/>
  </View>;
}
export function TokeaLogo({size=24}:{size?:number}){
  return <View style={{flexDirection:"row",alignItems:"center",gap:7}} accessible accessibilityLabel="Tokea">
    <View style={{width:28,height:32}} accessible={false}><Glass x={1} y={2}/><Glass x={13} y={5}/></View>
    <Text style={{fontFamily:displaySerif,fontSize:size,color:colors.text,letterSpacing:-0.7}}>tokea</Text>
  </View>;
}
