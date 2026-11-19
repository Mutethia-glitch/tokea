import { ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Action } from "@/native-cards";
import { Heading, Screen } from "@/ui";
import { colors } from "@/theme";
export default function PrivacyScreen(){
  const paragraphs=[
    ["What we collect","We'll ask for a clear photo of your government-issued ID, showing your date of birth, and a selfie. A trained team member checks that you are 18 or older and that the ID belongs to you. We don't use facial-recognition software to make the decision."],
    ["Why","Age verification is required before hosting, requesting to join or entering session chats. You may browse public session listings and view your own profile while your account is unverified."],
    ["Who can see your photos","Only approved members of our review team can see your ID and selfie while reviewing them. Photos are encrypted, are not shown on your profile and won't appear on drink sessions. We keep a record of the decision and review date."],
    ["When photos are deleted","Our plan is to delete both photos as soon as the review is finished or when 24 hours have passed, whichever comes first. Before launch, we must prove that this works reliably even when a system fails. We are not yet collecting real ID photos."],
    ["Review updates","We aim to review within five minutes when our team is available, but it can take longer. We'll notify you when a decision is made. A finished review can't be changed by another reviewer. If we can't verify your photos, you can submit clearer ones in a new application."],
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
