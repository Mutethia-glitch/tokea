# M6 — Manual ID & selfie age verification (local-only)

## Current developer status
- Native iOS/Android form: ID + selfie picker/camera, full-ID readability and selfie guidance, consent and status.
- Authenticated account may browse public session cards, profile and notifications while `users.age_verified_at IS NULL`. Backend protects all mutations and private chats, regardless of client UI.
- Human review: staff role can see encrypted, unexpired photos in a local admin workspace at `http://127.0.0.1:4400/admin`. Final Verify/Decline is a single database transaction. Another admin cannot reverse it (PostgreSQL trigger plus row lock).
- Email invitations: owner-only; token hashed in database, 48-hour expiry, verified email identity required on acceptance. No SMTP means endpoint fails closed. The first owner must be bootstrapped separately with a real authenticated identity.
- On approval user gets `age_verified_at` and previously blocked host/request/chat actions become accessible automatically; final decisions generate user-scoped inbox and queued opt-in phone notifications.
- User submission sends a pending notification explaining **5-minute review target during staffed hours**; no unstaffed review promise.
- Document images are validated and re-encoded to JPEG, losing embedded metadata, and AES-256-GCM encrypted in a private local directory. Files are removed on review or when cases exceed their 24-hour expiry; reviewer access ends at expiry.
- **No real images may be collected until production-grade deletion uptime, key management, backup exclusion, legal review and incident procedures are demonstrated.** Environment defaults keep uploads disabled.

## Configure local development safely
- Continue using PostgreSQL at `127.0.0.1:5433`. Run `bun scripts/migrate.mjs` in `services/api` after pulling this branch.
- User sign-in must be backed by a real JWT issuer with JWKS, issuer and audience config. A JWT's `sub` must match an existing, active `users.id`. **Do not create a fake production sign-in bypass.**
- `VERIFICATION_UPLOADS_ENABLED=false` by default. For synthetic local test images *only*, configure `VERIFICATION_ENCRYPTION_KEY_BASE64` with a securely generated 32-byte key and `VERIFICATION_PHOTO_DIR` to a private local directory. Never put photos or keys in a git repo, versioned backups, shared folders or public service.
- CI uses generated synthetic images and local encrypted storage. Tests must verify app permissions, image encryption/deletion, human review locking and expiry.
- Local admin panel is a staff **web tool**; Tokea consumer experience remains native. Staff see a simple `Sign in with your work account` button, using provider-backed OAuth2 PKCE (unavailable until an identity provider is configured). Never ask reviewers to paste API tokens or secret keys.
- Provision real SMTP only after selecting email service and owner identity. Email admin invitations cannot work until provider credentials are supplied, verified email claims exist and `ADMIN_PANEL_URL` is an accessible authorized URL.
- Real notifications require EAS/FCM/APNs platform credentials, real phone builds and push delivery monitoring. A queued notification is not proof of OS delivery.
- Support queue staffing, incident response, appeal process and legal analysis are required before promising review turnaround or accepting sensitive IDs from real users.

## Manual verification checklist for reviewers
1. Confirm the ID is a legitimate-looking government photo document and all four edges, the portrait and date of birth are legible.
2. Confirm age on date of review is at least **18**, not inferred from the selfie alone.
3. Ensure a well-lit unfiltered selfie matches the ID's photo and the user is clearly visible.
4. Approve only when all checks pass. Otherwise decline with a short, respectful explanation.
5. Never screenshot, download, forward or publish the ID/selfie. Another admin cannot modify the final case. A declined applicant may submit a *new* case.
