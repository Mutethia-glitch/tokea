import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { Heading, Paper, Screen } from "@/ui";
import { Action, MessageBox } from "@/native-cards";
import { colors } from "@/theme";
import { TokeaLogo } from "@/branding";
import { getVerificationStatus, submitAgeReview, uploadIdentityPhoto, type VerificationStatus } from "@/verification";
import { releasePickedIdentityPhoto } from "@/temporary-identity-photos";

const AGE_TIPS=[
  "Use a valid government-issued photo ID showing your date of birth.",
  "Place the entire ID in the frame. Every corner, the face and date of birth must be visible and legible.",
  "Use bright, even lighting. Avoid glare, blur, reflections and shadows.",
  "For your selfie, face the camera directly; remove sunglasses or face coverings.",
  "Only upload photos of your own ID and face. Avoid filters and screenshots.",
  "JPG, PNG or WebP; up to 5 MB each.",
] as const;
type Selected={uri:string;mimeType:string}|null;
export default function VerifyAgeScreen(){
  const [status,setStatus]=useState<VerificationStatus|null>(null);
  const [id,setId]=useState<Selected>(null);
  const [selfie,setSelfie]=useState<Selected>(null);
  // Only the CURRENT selected cache file is retained; older previews are discarded.
  const pendingPhotoFiles=useRef<{id:Selected;selfie:Selected}>({id:null,selfie:null});
  function updatePhoto(kind:"id"|"selfie",photo:Selected){
    const previous=pendingPhotoFiles.current[kind];
    pendingPhotoFiles.current[kind]=photo;
    if(kind==="id")setId(photo);else setSelfie(photo);
    if(previous && previous.uri!==photo?.uri)releasePickedIdentityPhoto(previous.uri);
  }
  useEffect(()=>()=> {
    // Clean temporary camera/gallery copies when the screen is left or unmounted.
    releasePickedIdentityPhoto(pendingPhotoFiles.current.id?.uri);
    releasePickedIdentityPhoto(pendingPhotoFiles.current.selfie?.uri);
    pendingPhotoFiles.current={id:null,selfie:null};
  },[]);
  const [consent,setConsent]=useState(false);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const refresh=useCallback(async()=>{
    setLoading(true);
    try{setStatus(await getVerificationStatus());setError(null);}
    catch(e){setError(e instanceof Error?e.message:"Unable to check review status.");}
    finally{setLoading(false);}
  },[]);
  useFocusEffect(useCallback(()=>{void refresh();},[refresh]));
  async function choose(kind:"id"|"selfie",camera:boolean){
    const permission=camera?await ImagePicker.requestCameraPermissionsAsync():
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted){Alert.alert("Permission needed","Allow camera or gallery access in phone Settings.");return;}
    const options:ImagePicker.ImagePickerOptions={mediaTypes:["images"],allowsEditing:false,quality:0.95,
      base64:false,exif:false};
    const result=camera?await ImagePicker.launchCameraAsync(options):await ImagePicker.launchImageLibraryAsync(options);
    if(result.canceled||!result.assets[0])return;
    const image=result.assets[0];
    if(image.fileSize&&image.fileSize>5*1024*1024){
      releasePickedIdentityPhoto(image.uri);
      Alert.alert("Photo too large","Please choose a photo smaller than 5 MB.");return;
    }
    const mime=image.mimeType??"";
    if(!["image/jpeg","image/png","image/webp"].includes(mime)){
      releasePickedIdentityPhoto(image.uri);
      Alert.alert("Choose a different photo","Please use a JPG, PNG or WebP image.");return;
    }
    updatePhoto(kind,{uri:image.uri,mimeType:mime});
  }
  async function submit(){
    if(!id||!selfie)return;
    if(!consent){Alert.alert("Consent required","Please agree to temporary handling of your ID and selfie.");return;}
    setBusy(true);setError(null);
    try{
      await uploadIdentityPhoto(id.uri,"id",id.mimeType);
      await uploadIdentityPhoto(selfie.uri,"selfie",selfie.mimeType);
      const result=await submitAgeReview(consent);
      updatePhoto("id",null);updatePhoto("selfie",null);
      Alert.alert("Submitted for review",result.message);
      await refresh();
    }catch(e){setError(e instanceof Error?e.message:"Verification could not be submitted.");}
    finally{setBusy(false);}
  }
  const approved=status?.verified;
  const pending=status?.status==="pending";
  const showForm=!approved&&!pending;
  return <Screen><ScrollView contentContainerStyle={{paddingBottom:70}} showsVerticalScrollIndicator={false}>
    <View style={{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <Action secondary label="‹  Back" onPress={()=>router.back()}/>
      <TokeaLogo size={22}/>
    </View>
    <Heading title="Verify your age" subtitle="For adults 18+ only. Confirm your age to host a drink or request to join one."/>
    {loading?<ActivityIndicator color={colors.brand}/>:null}
    {error?<MessageBox text={error}/>:null}
    {approved?<Paper>
      <Text style={{color:colors.success,fontWeight:"700",fontSize:16}}>Age verified</Text>
      <Text style={{color:colors.muted,marginTop:8,lineHeight:22}}>You can now host, request to join, and chat in confirmed sessions.</Text>
      <View style={{marginTop:16}}><Action label="Go to Discover" onPress={()=>router.replace("/(tabs)")}/></View>
    </Paper>:null}
    {pending?<Paper>
      <Text style={{color:colors.brand,fontWeight:"700",fontSize:16}}>Your account is under review</Text>
      <Text style={{color:colors.muted,marginTop:9,lineHeight:22}}>Our support team aims to review within 5 minutes during staffed hours. This is an estimate, not a guarantee.</Text>
      <Text style={{color:colors.muted,marginTop:8,lineHeight:22}}>You can browse sessions and manage your profile while you wait. Hosting, join requests and private chat are locked until approval.</Text>
      <View style={{marginTop:14}}><Action secondary label="Check status" onPress={()=>void refresh()}/></View>
    </Paper>:null}
    {status?.status==="declined"?<MessageBox text={`Your previous submission could not be verified: ${status.reason??"Please submit clearer photos."} You can send a new submission; the previous review remains final.`}/>:null}
    {status?.status==="expired"?<MessageBox text="Your previous photos expired and were removed from the review queue. Please take new pictures."/>:null}
    {showForm&&!loading?<><Paper>
      <Text style={{fontSize:17,fontWeight:"700",color:colors.text,marginBottom:12}}>Before you take your pictures</Text>
      <View style={{gap:9}}>
        {AGE_TIPS.map(tip=><View key={tip} style={{flexDirection:"row",alignItems:"flex-start",gap:8}}>
          <Text style={{color:colors.muted,lineHeight:23}}>{"•"}</Text>
          <Text style={{flex:1,color:colors.muted,lineHeight:23}}>{tip}</Text>
        </View>)}
      </View>
    </Paper>
    <Paper>
      <Text style={{fontSize:16,fontWeight:"700",color:colors.text,marginBottom:12}}>1. Photo of your ID</Text>
      <Text style={{color:colors.muted,marginBottom:10}}>Include all corners and keep the date of birth readable.</Text>
      {id?<Image source={{uri:id.uri}} style={{height:175,resizeMode:"contain",borderRadius:12,backgroundColor:colors.background,marginBottom:12}}/>:null}
      <View style={{gap:9}}><Action label={id?"Retake ID photo":"Take ID photo"} secondary onPress={()=>void choose("id",true)}/>
        <Action label="Choose ID photo from gallery" secondary onPress={()=>void choose("id",false)}/></View>
    </Paper>
    <Paper>
      <Text style={{fontSize:16,fontWeight:"700",color:colors.text,marginBottom:12}}>2. A clear selfie</Text>
      <Text style={{color:colors.muted,marginBottom:10}}>A front-facing picture with your entire uncovered face visible.</Text>
      {selfie?<Image source={{uri:selfie.uri}} style={{height:175,resizeMode:"contain",borderRadius:12,backgroundColor:colors.background,marginBottom:12}}/>:null}
      <View style={{gap:9}}><Action label={selfie?"Retake selfie":"Take selfie"} secondary onPress={()=>void choose("selfie",true)}/>
        <Action label="Choose selfie from gallery" secondary onPress={()=>void choose("selfie",false)}/></View>
    </Paper>
    <Paper>
      <Pressable onPress={()=>setConsent(x=>!x)} accessibilityRole="checkbox" accessibilityState={{checked:consent}}
        style={{flexDirection:"row",gap:12,alignItems:"flex-start",minHeight:44}}>
        <Text style={{fontSize:22,color:colors.brand}}>{consent?"☑":"☐"}</Text>
        <Text style={{color:colors.text,flex:1,fontSize:13,lineHeight:21}}>
          I consent to Tokea's temporary collection and manual review of my ID and selfie to verify I am 18+.
          I understand images are encrypted and scheduled for deletion on review or within 24 hours, and only authorized reviewers may access them.
        </Text>
      </Pressable>
      <Pressable style={{marginTop:12}} onPress={()=>router.push("/privacy")}>
        <Text style={{color:colors.brand,fontWeight:"700",fontSize:13}}>Read the Privacy Policy</Text>
      </Pressable>
    </Paper>
    <Action label={busy?"Submitting securely…":"Submit ID and selfie"} disabled={busy||!id||!selfie||!consent}
      onPress={()=>void submit()}/>
    <Text style={{color:colors.muted,fontSize:12,lineHeight:20,marginTop:16}}>Photos are private, not visible on your profile or session cards. You can browse without submitting, but hosting and joining remain locked.</Text>
    </>:null}
  </ScrollView></Screen>;
}
