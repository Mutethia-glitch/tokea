import { Directory,File,Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import { getAccessToken } from "./api";
import { currentUserId,localApiUrl } from "./phone-login";

export type PublicProfile={id:string;displayName:string;phone:string|null;hasPhoto:boolean;
  photoVersion:string|null;ageVerified:boolean;};
const keyFor=(userId:string)=>"tokea_local_avatar_"+userId;

export async function currentAvatarUri(){
  const id=await currentUserId();
  if(!id)return null;
  const uri=await SecureStore.getItemAsync(keyFor(id));
  if(!uri)return null;
  const file=new File(uri);
  return file.exists?uri:null;
}
/** Profile pictures survive app restarts. Identity-check images never use this folder. */
export async function persistProfilePhoto(uri:string){
  const id=await currentUserId();
  if(!id)throw Error("Sign in to save a profile picture.");
  const directory=new Directory(Paths.document,"tokea-profile");
  directory.create({idempotent:true,intermediates:true});
  const src=new File(uri);
  if(!src.exists)throw Error("The selected photo is no longer available.");
  if(src.size>5*1024*1024)throw Error("Use a photo smaller than 5 MB.");
  const destination=new File(directory,id+"-"+Date.now()+".jpg");
  src.copy(destination);
  const old=await SecureStore.getItemAsync(keyFor(id));
  await SecureStore.setItemAsync(keyFor(id),destination.uri);
  if(old&&old!==destination.uri){
    const oldFile=new File(old);
    if(oldFile.exists&&old.startsWith(directory.uri))oldFile.delete();
  }
  return destination.uri;
}
export async function removeLocalProfilePhoto(){
  const id=await currentUserId();
  if(!id)return;
  const uri=await SecureStore.getItemAsync(keyFor(id));
  if(uri){
    const folder=new Directory(Paths.document,"tokea-profile");
    if(uri.startsWith(folder.uri)){
      const photo=new File(uri);if(photo.exists)photo.delete();
    }
  }
  await SecureStore.deleteItemAsync(keyFor(id));
}
export async function loadPublicProfile(){
  const token=await getAccessToken();
  if(!token)throw Error("Sign in to view your profile.");
  const result=await fetch(localApiUrl()+"/v1/me",{headers:{Authorization:"Bearer "+token}});
  if(!result.ok)throw Error("Your account details are unavailable.");
  return result.json() as Promise<PublicProfile>;
}
export async function changeDisplayName(name:string){
  const token=await getAccessToken();
  const response=await fetch(localApiUrl()+"/v1/me",{
    method:"PATCH",headers:{"Content-Type":"application/json",Authorization:"Bearer "+token},
    body:JSON.stringify({displayName:name.trim()}),
  });
  if(!response.ok)throw Error("Unable to update your name right now.");
}
export async function syncProfilePhoto(uri:string){
  const token=await getAccessToken();
  if(!token)throw Error("Sign in first to share your photo.");
  const photo=new File(uri);
  const response=await fetch(localApiUrl()+"/v1/me/photo",{
    method:"POST",headers:{"Content-Type":"image/jpeg",Authorization:"Bearer "+token},
    body:await photo.arrayBuffer(),
  });
  if(!response.ok)throw Error("Photo saved on this phone. Other people will see it when syncing is set up.");
  return true;
}
export async function removeSyncedPhoto(){
  const token=await getAccessToken();
  if(!token)return;
  await fetch(localApiUrl()+"/v1/me/photo",{
    method:"DELETE",headers:{Authorization:"Bearer "+token},
  });
}
