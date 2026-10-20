# HealthReachCare

Patient-facing HealthReachCare web app starter. Built with React, Vite, Firebase Web SDK and responsive CSS.

## Local development

1. Install Node.js 20.19+ or 22.12+.
2. Copy `.env.example` to `.env.local`.
3. Add the Firebase **web app** configuration values from the intended Firebase project.
4. Install dependencies and run the development server:

```sh
npm install
npm run dev
```

Create a production bundle with `npm run build`.

## Firebase collections expected by the current UI

- `doctors`: publicly readable, published practitioner records. The directory only displays records explicitly marked verified via `verified: true`, `isVerified: true`, or `verificationStatus: "verified"`.
- `users/{uid}/notifications`: personal notifications for the signed-in user, with optional `title`, `message`, `read`, and `createdAt` fields.

Configure and test Firestore security rules before production. Never make patient records, identity documents, prescriptions, or private profile data publicly readable. Only publish practitioner fields that are safe for public display.

## Honest integration status

The patient-facing UI includes home, doctor search/filtering, activity/notification states, medicine catalogue setup messaging, and Firestore-backed appointment, home-care, and prescription-enquiry request submission for signed-in users. A role-gated provider workspace is available for doctors and home-care providers to review assigned requests and accept or decline them, subject to the actual Firestore security rules and role/profile schema. Home-care requests must be assigned to a provider by a trusted dispatch/admin workflow before they appear in that provider's workspace. This repository does not yet include the trusted backend, tested Firestore rules, or Paystack checkout/webhook required for production provider workflows or payments. The UI does not mark requests paid. See [provider workflow and payments](docs/provider-workflow-and-payments.md). Medicine listings are not fabricated; the app shows setup messaging until the real catalogue is wired.

## Deployment

The app builds to `dist/`. It can be deployed to a static host that supports Vite assets. Configure environment variables in the deployment environment; do not commit real secrets or private credentials.
