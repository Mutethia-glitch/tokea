import { File, Paths } from "expo-file-system";

/**
 * Delete only images copied by the native image picker into our app sandbox.
 * Never delete a user's original image from Photos, gallery or an external URI.
 */
export function releasePickedIdentityPhoto(uri:string|null|undefined):boolean {
  if(!uri || !uri.startsWith("file://")) return false;
  const cache=Paths.cache.uri.replace(/\/$/,"")+"/";
  if(!uri.startsWith(cache))return false;
  // ImagePicker files live inside our application's temporary cache directory.
  // Keep any other app data outside its scope.
  try {
    const file=new File(uri);
    if(file.exists)file.delete();
    return true;
  }catch(error){
    console.warn("Could not remove temporary verification image",error instanceof Error?error.message:"file cleanup error");
    return false;
  }
}
