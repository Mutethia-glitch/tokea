import { Image, Platform, Text, View } from "react-native";
import { colors } from "./theme";

export const displaySerif=Platform.OS==="ios"?"Georgia":"serif";

/** Exact approved paired-glass mark, rasterized from assets/tokea-app-icon.svg. */
export function TokeaLogo({size=24}:{size?:number}){
  return <View style={{flexDirection:"row",alignItems:"center",gap:6}} accessible accessibilityLabel="Tokea">
    <Image source={require("../assets/brand-mark.png")} resizeMode="contain"
      style={{width:26,height:30}} accessibilityIgnoresInvertColors/>
    <Text style={{fontFamily:displaySerif,fontSize:size,color:colors.text,letterSpacing:-0.7}}>tokea</Text>
  </View>;
}
