import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Action } from "@/native-cards";
import { Heading, Screen } from "@/ui";
import { colors } from "@/theme";
export default function PrivacyScreen(){
  const paragraphs=[
    ["What we collect","For manual 18+ age verification we request a clear photo of a government-issued ID with a visible date of birth and a separate selfie. Authorized reviewers compare them to decide whether the applicant is an adult. We do not automatically extract a biometric face template or retain the ID number as a separate field."],
    ["Why","Age verification is required before hosting, requesting to join or entering session chats. You may browse public session listings and view your own profile while your account is unverified."],
    ["Storage and access","Images are processed to remove embedded metadata, encrypted at rest, and available only to authorized reviewers. Reviews record the decision, reviewer, reason and timestamp; they do not retain the photos as account-profile images."],
    ["Image retention","Images are scheduled for deletion immediately after a final review, or when their 24-hour review window expires, whichever happens first. A cleanup process runs while the service is operational. This 24-hour maximum must be verified with production uptime, backups and deletion monitoring before launch; it is not yet a live-service guarantee."],
    ["Review decisions","Reviewers can verify or decline an application. Once final, that case cannot be changed by another reviewer. Declined applicants may submit a new case. We aim for a five-minute response during staffed hours; timing cannot be guaranteed."],
    ["Notifications","We send in-app review-submitted and review-result notifications. Phone push alerts require optional device permission and functioning platform delivery."],
    ["Your rights","You may request access, correction, deletion or information about how your data is handled in accordance with applicable Kenyan data-protection law. Contact and operational rights-request channels will be published before launch."],
    ["Current status","This is the policy for the planned native product, currently under local development; production identity collection has not been enabled. Legal and security review must be completed before real people are asked to upload identification."],
  ];
  return <Screen><ScrollView contentContainerStyle={{paddingBottom:56}}>
    <View style={{alignSelf:"flex-start",marginBottom:14}}><Action label="‹  Back" secondary onPress={()=>router.back()}/></View>
    <Heading title="Privacy Policy" subtitle="Tokea · Draft updated 19 November 2026"/>
    {paragraphs.map(([heading,body])=><View key={heading} style={{marginBottom:22}}>
      <Text style={{fontWeight:"700",fontSize:16,color:colors.text,marginBottom:7}}>{heading}</Text>
      <Text style={{fontSize:13,color:colors.muted,lineHeight:21}}>{body}</Text>
    </View>)}
  </ScrollView></Screen>;
}
