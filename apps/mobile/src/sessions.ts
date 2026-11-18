import { api } from "./api";

export const CATEGORIES=[
  "Beer","Wine","Cocktails","Muratina","Whiskey","Vodka","Gin","Rum","Tequila",
  "Brandy","Spirits","Coffee","Soft drinks","Tea",
] as const;
export type Category=(typeof CATEGORIES)[number];
export const NEIGHBOURHOODS=[
  "Westlands","Kilimani","Kileleshwa","Lavington","Karen","CBD",
  "Parklands","Upper Hill","Ngara","South B","South C","Runda",
] as const;
export type Neighbourhood=(typeof NEIGHBOURHOODS)[number];

export type NativeSession={
  id:string;hostId:string;hostName:string;isHost:boolean;title:string;category:Category;
  neighbourhood:string;guestCapacity:number;seatsLeft:number;status:"open"|"paused"|"ended";
  startsAt:string;endsAt:string;
};
export type NativeRequest={
  id:string;sessionId:string;title:string;category:Category;neighbourhood:string;
  hostId:string;hostName:string;applicantId:string;applicantName:string;
  partySize:number;intro:string;status:"pending"|"accepted"|"declined"|"cancelled";createdAt:string;
};
export type NativeMessage={
  id:string;sessionId:string;authorId:string;authorName:string;text:string;createdAt:string;
};

export function listSessions(category?:Category) {
  return api<{sessions:NativeSession[]}>(`/v1/sessions${category?`?category=${encodeURIComponent(category)}`:""}`);
}
export async function loadSession(id:string) {
  return (await api<{session:NativeSession}>(`/v1/sessions/${encodeURIComponent(id)}`)).session;
}
export function publishSession(input:{
  title:string;category:Category;neighbourhood:Neighbourhood;
  guestCapacity:number;startsAt:string;endsAt:string;
}) {return api<{id:string}>("/v1/sessions","POST",input);}
export function listRequests() {
  return api<{incoming:NativeRequest[];sent:NativeRequest[]}>("/v1/requests");
}
export function requestToJoin(sessionId:string,partySize:number,intro:string) {
  return api<{requestId:string;status:"pending"}>(`/v1/sessions/${encodeURIComponent(sessionId)}/requests`,"POST",{partySize,intro});
}
export function decideRequest(sessionId:string,requestId:string,decision:"accepted"|"declined") {
  return api<{decision:string}>(`/v1/sessions/${encodeURIComponent(sessionId)}/requests/${encodeURIComponent(requestId)}/decision`,
    "POST",{decision});
}
export function cancelRequest(requestId:string) {
  return api<{cancelled:boolean}>(`/v1/requests/${encodeURIComponent(requestId)}/cancel`,"PATCH");
}
export async function listMessages(sessionId:string) {
  return (await api<{messages:NativeMessage[]}>(`/v1/sessions/${encodeURIComponent(sessionId)}/messages`)).messages;
}
export async function sendMessage(sessionId:string,text:string) {
  return (await api<{message:NativeMessage}>(`/v1/sessions/${encodeURIComponent(sessionId)}/messages`,"POST",{text})).message;
}
