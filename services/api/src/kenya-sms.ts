import { ApiError } from "./auth.js";

/** Africa's Talking Kenya; credentials are never shipped to native app source. */
export async function sendKenyaOtp(phone:string,code:string){
  const username=process.env.AT_USERNAME;
  const key=process.env.AT_API_KEY;
  const mode=process.env.AT_MODE;
  if(!username||!key||!["sandbox","live"].includes(mode??""))
    throw new ApiError(503,"SMS sign-in is not configured yet.");
  const url=mode==="sandbox"
    ?"https://api.sandbox.africastalking.com/version1/messaging"
    :"https://api.africastalking.com/version1/messaging";
  const body=new URLSearchParams({username,to:phone,
    message:`Your Tokea sign-in code is ${code}. It expires in 5 minutes. Never share this code.`});
  const sender=process.env.AT_SENDER_ID;
  if(sender)body.set("from",sender);
  let response:Response;
  try {
    response=await fetch(url,{method:"POST",
      headers:{"apiKey":key,"accept":"application/json",
        "content-type":"application/x-www-form-urlencoded"},
      body,signal:AbortSignal.timeout(10000)});
  }catch{throw new ApiError(502,"Unable to send your sign-in code. Please try again.");}
  if(!response.ok)throw new ApiError(502,"SMS provider could not accept the message.");
  const data=await response.json() as {
    SMSMessageData?:{Recipients?:{statusCode?:number;status?:string}[]};
  };
  const recipient=data.SMSMessageData?.Recipients?.[0];
  if(!recipient||recipient.statusCode!==101)
    throw new ApiError(502,"SMS was not accepted by the provider. Try again.");
  // Accepted by provider does not mean it was delivered to a handset.
}
