import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { getVerificationStatus, type VerificationStatus } from "@/verification";
import { Heading, Paper, Screen } from "@/ui";
import { colors } from "@/theme";
import { enablePhoneNotifications } from "@/push";
import { Action, MessageBox } from "@/native-cards";
import { currentUserId,signOut } from "@/phone-login";
import { changeDisplayName,currentAvatarUri,loadPublicProfile,persistProfilePhoto,
  removeLocalProfilePhoto,removeSyncedPhoto,syncProfilePhoto,type PublicProfile } from "@/profile-photo";
import { PersonAvatar } from "@/person-avatar";

export default function ProfileScreen(){
  const [loading,setLoading]=useState(false);
  const [enabled,setEnabled]=useState(false);
  const [verification,setVerification]=useState<VerificationStatus|null>(null);
  const [profile,setProfile]=useState<PublicProfile|null>(null);
  const [name,setName]=useState("");
  const [avatar,setAvatar]=useState<string|null>(null);
  const [currentId,setCurrentId]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState<string|null>(null);
  useFocusEffect(useCallback(()=>{
    void currentUserId().then(setCurrentId);
    void currentAvatarUri().then(setAvatar);
    void getVerificationStatus().then(setVerification).catch(()=>setVerification(null));
    void loadPublicProfile().then(data=>{
      setProfile(data);setName(data.displayName);
    }).catch(()=>setProfile(null));
  },[]));
  async function chooseAvatar(){
    const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
    if(!permission.granted){Alert.alert("Permission needed","Allow access to choose a profile photo.");return;}
    const picked=await ImagePicker.launchImageLibraryAsync({
      mediaTypes:["images"],allowsEditing:true,aspect:[1,1],quality:0.85,exif:false,
    });
    if(picked.canceled||!picked.assets[0])return;
    setBusy(true);setNotice(null);
    try{
      const saved=await persistProfilePhoto(picked.assets[0].uri);
      setAvatar(saved);
      try{
        await syncProfilePhoto(saved);
        setNotice("Photo saved! Other members can see it on your sessions.");
      }catch{
        setNotice("Photo saved on this phone. It'll appear to others when profile sync is connected.");
      }
    }catch(e){Alert.alert("Couldn't save photo",e instanceof Error?e.message:"Please choose another photo.");}
    finally{setBusy(false);}
  }
  async function removePhoto(){
    setBusy(true);
    try{
      await removeLocalProfilePhoto();
      setAvatar(null);
      await removeSyncedPhoto().catch(()=>{});
      setNotice("Profile photo removed from this phone.");
    }finally{setBusy(false);}
  }
  async function saveName(){
    setBusy(true);
    try{
      await changeDisplayName(name);
      setNotice("Your name has been updated.");
    }catch(e){Alert.alert("Couldn't save name",e instanceof Error?e.message:"Try again.");}
    finally{setBusy(false);}
  }
  async function optIn(){
    setLoading(true);
    try{
      await enablePhoneNotifications();setEnabled(true);
      Alert.alert("Notifications enabled","Important Tokea updates can now appear on your phone.");
    }catch(e){Alert.alert("Unable to enable notifications",e instanceof Error?e.message:"Please try again.");}
    finally{setLoading(false);}
  }
  return <Screen><ScrollView showsVerticalScrollIndicator={false}
    contentContainerStyle={{paddingBottom:55}}>
    <Heading title="My profile" subtitle="The way people get to know you on Tokea."/>
    {!currentId?<Paper>
      <Text style={{color:colors.text,fontSize:16,fontWeight:"700",marginBottom:8}}>Welcome!</Text>
      <Text style={{color:colors.muted,marginBottom:15}}>Sign in to keep your profile, photos, and drink requests together.</Text>
      <Action label="Sign in with phone" onPress={()=>router.push("/sign-in")}/>
    </Paper>:<>
    <Paper>
      <View style={{alignItems:"center",marginBottom:18,gap:8}}>
        <PersonAvatar userId={currentId} name={name||"You"} hasPhoto={profile?.hasPhoto??false}
          photoVersion={profile?.photoVersion} localUri={avatar} size={108}/>
        <Text style={{color:colors.text,fontSize:17,fontWeight:"700"}}>{name||"Your name"}</Text>
        <Text style={{color:colors.muted,fontSize:12}}>Your photo stays saved after closing the app.</Text>
      </View>
      <Action secondary label={busy?"Saving photo…":"Choose profile photo"} disabled={busy}
        onPress={()=>void chooseAvatar()}/>
      {avatar?<View style={{marginTop:10}}><Action secondary label="Remove profile photo"
        disabled={busy} onPress={()=>void removePhoto()}/></View>:null}
      <Text style={{color:colors.muted,fontSize:12,lineHeight:20,marginTop:12}}>
        Profile pictures are different from your private age-verification photos.
      </Text>
      <Text style={{color:colors.text,fontWeight:"600",marginTop:18,marginBottom:9}}>Display name</Text>
      <TextInput value={name} onChangeText={setName} maxLength={60}
        placeholder="How should people call you?" placeholderTextColor={colors.muted}
        style={{minHeight:48,paddingHorizontal:14,borderWidth:1,borderColor:colors.border,
          borderRadius:12,color:colors.text,backgroundColor:colors.card,marginBottom:12}}/>
      <Action label="Save my name" disabled={busy||name.trim().length<2} onPress={()=>void saveName()}/>
      {notice?<View style={{marginTop:12}}><MessageBox text={notice}/></View>:null}
    </Paper>
    <Paper>
      <Text style={{color:colors.text,fontSize:16,fontWeight:"700"}}>Age verification</Text>
      <Text style={{color:verification?.verified?colors.success:colors.muted,
        fontSize:13,marginTop:9,marginBottom:13,lineHeight:20}}>
        {verification?.verified?"Verified — you can host and join sessions.":
          verification?.status==="pending"?"Under review — you can browse while our team reviews your photos.":
          verification?.status==="declined"?"Not approved — you can send clearer photos in a new submission.":
          "Verify your age with an ID and selfie to host or join drinks."}
      </Text>
      <Pressable accessibilityRole="button" onPress={()=>router.push("/verification")}
        style={{minHeight:44,justifyContent:"center"}}>
        <Text style={{color:colors.brand,fontWeight:"700"}}>
          {verification?.verified?"View verification status":
            verification?.status==="pending"?"Check review progress":"Verify my age"}
        </Text>
      </Pressable>
      <Pressable accessibilityRole="button" onPress={()=>router.push("/privacy")}
        style={{minHeight:44,justifyContent:"center"}}>
        <Text style={{color:colors.muted,fontWeight:"600"}}>Privacy Policy</Text>
      </Pressable>
    </Paper>
    <Paper>
      <Text style={{color:colors.text,fontSize:16,fontWeight:"600"}}>Phone notifications</Text>
      <Text style={{color:colors.muted,lineHeight:21,marginVertical:11}}>
        Receive updates when you're approved, invited, or have a new message. You can always see updates in Tokea too.
      </Text>
      <Action label={loading?"Enabling…":enabled?"Notifications enabled":"Enable phone notifications"}
        disabled={loading||enabled} onPress={()=>void optIn()}/>
    </Paper>
    <Paper><Action label="See in-app notifications" secondary
      onPress={()=>router.push("/notifications")}/></Paper>
    <Action label="Sign out" secondary onPress={()=>Alert.alert("Sign out of Tokea?",
      "Your profile photo stays saved on this phone for when you sign back in.",[
        {text:"Cancel",style:"cancel"},
        {text:"Sign out",style:"destructive",onPress:()=>void signOut().then(()=>router.replace("/sign-in"))},
      ])}/>
    </>}
    <Text style={{color:colors.muted,fontSize:12,marginTop:18}}>For adults 18+ only</Text>
  </ScrollView></Screen>;
}
