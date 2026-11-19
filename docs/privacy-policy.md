# Tokea Privacy Policy — draft update

**Original effective date:** 16 November 2026
**Age-verification revisions:** 19 November 2026
**Status:** Proposed policy for the native Tokea app; **not yet operational or legally approved**. No public support or contact email is supplied at this stage.

## Who may use Tokea

Tokea is intended only for people aged 18 or older in Kenya. A signed-in account that has not completed age verification may browse available public sessions and manage its own profile. Hosting a session, sending or accepting joining requests and participating in private session chats require a successful age review.

## Personal information we collect for age verification

To verify that you are an adult, Tokea requests (a) a clear picture of a government-issued photo identity document with a visible date of birth and (b) a clear selfie of the person applying. An authorized human reviewer visually checks that the date of birth shows 18+ and that the face reasonably matches the document. We do not need to retain an ID number in a separate searchable profile field or produce a facial-recognition template. We may also retain a limited review record: your account ID, submission time, review status, reviewer identifier, decision date, and any decline reason.

We ask for informed, explicit consent on the submission page before accepting the review application. If you do not upload documents, you may still browse publicly available sessions, but cannot host, send join requests or use private session chat.

## Limited purpose and access

ID/selfie photos are used only to confirm adult eligibility and prevent misuse of an adults-only service. They are not placed in public profiles, session cards or other user-visible content. Authorized administrators see each pending document pair only to conduct a review; access must use authenticated, role-limited accounts. A second reviewer cannot overwrite a final review on the same submission. Where a submission is declined, a user may make a new, separate submission, preserving the previous review audit record.

## Protection and retention

Our proposed system validates and re-encodes uploads to remove embedded image metadata, encrypts photos at rest with AES-256-GCM, uses private storage outside public directories, and makes photo access available only to authorized reviewers while a submission is pending. Review records and notifications do not contain or expose the photo bytes.

**The intended photo retention limit is 24 hours from the initial upload, and less if the review finishes sooner.** The service attempts to delete both encrypted document and selfie files immediately following a final review, and automatically expires and deletes outstanding files after 24 hours. It denies reviewer access after expiry. We intend to exclude this storage from backups.

**Important pre-launch qualification:** source code and local tests alone cannot guarantee a 24-hour maximum during downtime, backups or operational failures. The 24-hour commitment must not be advertised as operational until an independently scheduled cleanup process, monitoring, backup exclusion, secure-key operations and deletion verification are functioning. The draft policy will be finalized after that validation.

We retain the yes/no eligibility result, review time and reviewer audit metadata beyond the image-retention period only as needed for account eligibility, safety, lawful audit and dispute handling, subject to a documented retention schedule before launch.

## Review timing and notifications

After you submit both photos, Tokea will provide an in-app notification acknowledging receipt. Our target is human review within approximately five minutes **during staffed review hours**; this is an estimate, not a guaranteed deadline. You can continue browsing while the decision is pending. After a human reviewer approves or declines the submission, Tokea updates your account and sends an in-app decision notification. Phone push notices are optional and depend on notification permission and working push delivery.

If a submission cannot be reviewed before its 24-hour expiration, it expires and requires a fresh submission. We do not use automated face recognition to decide that a user is an adult.

## Storage, access rights and account choices

We intend to protect the images during the short retention period using encryption at rest, authenticated staff access, limited network exposure and deletion monitoring. No system can promise zero risk. Users will be able to request access, correction or deletion of eligible personal information and seek help with review errors through operational support and privacy channels provided before launch. Except where required by applicable law, review photos should not be retained for advertising, analytics or product training.

## Legal and launch requirements

This draft must be reviewed for compliance with the **Kenya Data Protection Act, 2019**, regulations and ODPC guidance. Government ID photos and identifiable face images involve highly sensitive personal information and may trigger additional data protection obligations, including a data protection impact assessment (DPIA), appropriate lawful processing conditions and ODPC registration obligations. No live ID/selfie collection should start before these issues and operational safeguards are resolved.

**The software is currently being built and tested locally. No production identity collection, email invitation delivery or phone-push service has been activated.**
