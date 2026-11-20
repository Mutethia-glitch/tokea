"use strict";
let token="",selected="",objectUrls=[],currentInvitation="";
const $=id=>document.getElementById(id);
async function api(path,method="GET",data){
  const headers={Authorization:"Bearer "+token};
  if(data)headers["Content-Type"]="application/json";
  const response=await fetch(path,{method,headers,cache:"no-store",
    ...(data?{body:JSON.stringify(data)}:{})});
  if(!response.ok){
    let message="Something went wrong. Please try again.";
    try{const j=await response.json();if(typeof j.error==="string")message=j.error;}catch{}
    throw Error(message);
  }
  return response.json();
}
function cleanupImages(){
  for(const u of objectUrls)URL.revokeObjectURL(u);
  objectUrls=[];
  $("id-image").removeAttribute("src");
  $("selfie-image").removeAttribute("src");
}
function asBase64Url(bytes){
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function beginLogin(){
  $("sign-error").textContent="";
  try{
    const cfg=await (await fetch("/v1/admin/auth/config",{cache:"no-store"})).json();
    if(!cfg.authorizeUrl)throw Error(cfg.error||"Team sign-in isn't available yet. Please contact the Tokea owner.");
    const verifier=asBase64Url(crypto.getRandomValues(new Uint8Array(32)));
    const state=asBase64Url(crypto.getRandomValues(new Uint8Array(20)));
    const nonce=asBase64Url(crypto.getRandomValues(new Uint8Array(20)));
    const challenge=asBase64Url(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(verifier))));
    sessionStorage.setItem("tokea_staff_oauth",JSON.stringify({verifier,state,nonce,expires:Date.now()+300_000}));
    const url=new URL(cfg.authorizeUrl);
    url.searchParams.set("client_id",cfg.clientId);
    url.searchParams.set("response_type","code");
    url.searchParams.set("redirect_uri",cfg.redirectUri);
    url.searchParams.set("scope",cfg.scope||"openid email");
    url.searchParams.set("state",state);
    url.searchParams.set("nonce",nonce);
    url.searchParams.set("code_challenge",challenge);
    url.searchParams.set("code_challenge_method","S256");
    location.assign(url.toString());
  }catch(e){$("sign-error").textContent=e.message;}
}
function signOut(){
  cleanupImages();token="";selected="";sessionStorage.removeItem("tokea_staff_oauth");
  $("workspace").hidden=true;$("sign-in").hidden=false;
}
async function loadQueue(){
  $("state").textContent="Loading applications…";
  const data=await api("/v1/admin/verifications");
  if(selected && !data.submissions.some(item=>item.id===selected)){
    cleanupImages();$("review").hidden=true;selected="";
  }
  $("queue").replaceChildren();
  $("state").textContent=data.submissions.length?
    data.submissions.length+" application(s) waiting for review.":"No applications waiting. You're all caught up!";
  for(const item of data.submissions){
    const card=document.createElement("div");card.className="card";
    const left=document.createElement("div");
    const name=document.createElement("strong");name.textContent=item.displayName;
    const date=document.createElement("p");date.textContent="Received "+new Date(item.submittedAt).toLocaleString();
    left.append(name,date);card.append(left);
    const btn=document.createElement("button");btn.textContent="Review photos";
    btn.onclick=()=>openReview(item).catch(e=>$("state").textContent=e.message);
    card.append(btn);$("queue").append(card);
  }
}
async function photo(id,kind){
  const response=await fetch("/v1/admin/verifications/"+id+"/photos/"+kind,{
    headers:{Authorization:"Bearer "+token},cache:"no-store"});
  if(!response.ok)throw Error("These photos are no longer available. The application may already be reviewed.");
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
  if(decision==="declined"&&reason.length<5){
    $("review-error").textContent="Tell the applicant what they should correct.";return;
  }
  for(const id of ["approve","decline"])$(id).disabled=true;
  try{
    await api("/v1/admin/verifications/"+selected+"/decision","POST",
      decision==="declined"?{decision,reason}:{decision});
    cleanupImages();$("review").hidden=true;selected="";
    $("state").textContent=decision==="verified"?"Age approved. Applicant notified.":"Application declined. Applicant notified.";
    await loadQueue();
  }catch(e){$("review-error").textContent=e.message;}
  finally{for(const id of ["approve","decline"])$(id).disabled=false;}
}
async function afterLogin(){
  if(currentInvitation){
    await api("/v1/admin/invitations/accept","POST",{token:currentInvitation});
    currentInvitation="";sessionStorage.removeItem("tokea_staff_invite");
  }
  await loadQueue();$("sign-in").hidden=true;$("workspace").hidden=false;
  // Owner-only invitation capabilities are determined by the API.
  try{const role=await api("/v1/admin/me");$("invite-section").hidden=role.role!=="owner";}
  catch{$("invite-section").hidden=true;}
}
async function returnFromLogin(){
  const search=new URLSearchParams(location.search),code=search.get("code"),state=search.get("state");
  if(!code)return;
  history.replaceState(null,"",location.pathname);
  const saved=sessionStorage.getItem("tokea_staff_oauth");
  sessionStorage.removeItem("tokea_staff_oauth");
  if(!saved)throw Error("Sign-in expired. Please try again.");
  const attempt=JSON.parse(saved);
  if(!state||state!==attempt.state||Date.now()>attempt.expires)
    throw Error("Sign-in expired. Please try again.");
  const response=await fetch("/v1/admin/auth/exchange",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({code,verifier:attempt.verifier,nonce:attempt.nonce}),cache:"no-store"});
  const result=await response.json();
  if(!response.ok||!result.accessToken)throw Error(result.error||"Sign-in could not be completed.");
  token=result.accessToken;
  await afterLogin();
}
$("connect").onclick=()=>void beginLogin();
$("refresh").onclick=()=>loadQueue().catch(e=>$("state").textContent=e.message);
$("sign-out").onclick=signOut;
setInterval(()=>{
  if(token && !$("workspace").hidden)void loadQueue()
    .catch(e=>{$("state").textContent=e.message;});
},20_000);
$("approve").onclick=()=>void decide("verified");
$("decline").onclick=()=>void decide("declined");
$("close").onclick=()=>{cleanupImages();$("review").hidden=true;selected="";};
$("send-invite").onclick=async()=>{
  $("invite-state").textContent="";
  const email=$("invite-email").value.trim();
  if(!email.includes("@")){$("invite-state").textContent="Enter a valid email address.";return;}
  try{
    await api("/v1/admin/invitations","POST",{email});
    $("invite-email").value="";$("invite-state").textContent="Invitation sent. Your colleague will receive an email.";
  }catch(e){$("invite-state").textContent=e.message;}
};
if(location.hash.startsWith("#invite=")){
  currentInvitation=decodeURIComponent(location.hash.slice(8));
  sessionStorage.setItem("tokea_staff_invite",currentInvitation);
  history.replaceState(null,"",location.pathname+location.search);
}else currentInvitation=sessionStorage.getItem("tokea_staff_invite")||"";
void returnFromLogin().catch(e=>{$("sign-error").textContent=e.message;token="";});
window.addEventListener("pagehide",cleanupImages);
