"use strict";
let token="",selected="",objectUrls=[];
const $=id=>document.getElementById(id);
async function api(path,method="GET",data){
  const headers={Authorization:"Bearer "+token};
  if(data)headers["Content-Type"]="application/json";
  const response=await fetch(path,{method,headers,cache:"no-store",
    ...(data?{body:JSON.stringify(data)}:{})});
  if(!response.ok){let error="Request failed ("+response.status+")";try{const j=await response.json();error=j.error??error;}catch{}throw Error(error);}
  return response.json();
}
function cleanupImages(){for(const u of objectUrls)URL.revokeObjectURL(u);objectUrls=[];$("id-image").removeAttribute("src");$("selfie-image").removeAttribute("src");}
async function loadQueue(){
  $("state").textContent="Loading…";const data=await api("/v1/admin/verifications");
  $("queue").replaceChildren();
  $("state").textContent=data.submissions.length?"Review oldest submissions first.":"No pending reviews.";
  for(const item of data.submissions){
    const card=document.createElement("div");card.className="card";
    const text=document.createElement("div");
    const title=document.createElement("strong");title.textContent=item.displayName;
    const date=document.createElement("p");date.textContent="Submitted "+new Date(item.submittedAt).toLocaleString();
    text.append(title,date);card.append(text);
    const button=document.createElement("button");button.textContent="Review";
    button.onclick=()=>openReview(item).catch(e=>$("state").textContent=e.message);
    card.append(button);$("queue").append(card);
  }
}
async function photo(id,kind){
  const response=await fetch("/v1/admin/verifications/"+id+"/photos/"+kind,{
    headers:{Authorization:"Bearer "+token},cache:"no-store"});
  if(!response.ok)throw Error("Photo no longer available (reviewed or expired).");
  const url=URL.createObjectURL(await response.blob());objectUrls.push(url);return url;
}
async function openReview(item){
  cleanupImages();selected=item.id;$("review").hidden=false;
  $("review-title").textContent="Review "+item.displayName;
  $("review-error").textContent="";$("reason").value="";
  try{
    const results=await Promise.all([photo(item.id,"id"),photo(item.id,"selfie")]);
    $("id-image").src=results[0];$("selfie-image").src=results[1];
    $("review").scrollIntoView({behavior:"smooth"});
  }catch(e){cleanupImages();$("review").hidden=true;throw e;}
}
async function decide(decision){
  const reason=$("reason").value.trim();
  if(decision==="declined"&&reason.length<5){$("review-error").textContent="Provide a specific reason (5+ characters).";return;}
  for(const id of ["approve","decline"])$(id).disabled=true;
  try{
    await api("/v1/admin/verifications/"+selected+"/decision","POST",
      decision==="declined"?{decision,reason}:{decision});
    cleanupImages();$("review").hidden=true;selected="";
    await loadQueue();
  }catch(e){$("review-error").textContent=e.message;}
  finally{for(const id of ["approve","decline"])$(id).disabled=false;}
}
$("connect").onclick=async()=>{
  token=$("token").value.trim();$("token").value="";$("sign-error").textContent="";
  try{await loadQueue();$("sign-in").hidden=true;$("workspace").hidden=false;}
  catch(e){$("sign-error").textContent=e.message;token="";}
};
$("refresh").onclick=()=>loadQueue().catch(e=>$("state").textContent=e.message);
$("approve").onclick=()=>decide("verified");
$("decline").onclick=()=>decide("declined");
$("close").onclick=()=>{cleanupImages();$("review").hidden=true;selected="";};
$("send-invite").onclick=async()=>{
  $("invite-state").textContent="";
  try{
    await api("/v1/admin/invitations","POST",{email:$("invite-email").value.trim()});
    $("invite-email").value="";$("invite-state").textContent="Invitation email sent.";
  }catch(e){$("invite-state").textContent=e.message;}
};
if(location.hash.startsWith("#invite=")){
  const invite=decodeURIComponent(location.hash.slice(8));
  history.replaceState(null,"",location.pathname);
  const p=document.createElement("p");
  p.textContent="An invitation link was found. Enter your verified email identity token, then accept it.";
  $("sign-in").append(p);
  const btn=document.createElement("button");btn.textContent="Accept invitation";
  btn.onclick=async()=>{
    token=$("token").value.trim();
    try{await api("/v1/admin/invitations/accept","POST",{token:invite});$("sign-error").textContent="Invitation accepted. Sign in again to open reviews.";}
    catch(e){$("sign-error").textContent=e.message;}
  };$("sign-in").append(btn);
}
window.addEventListener("pagehide",cleanupImages);
