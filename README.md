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

The patient-facing UI includes home, doctor search/filtering, activity/notification states, medicine catalogue setup messaging, and request-form UI. The appointment, home-care and prescription forms currently **do not submit or save requests**. A secure backend workflow, authorization rules, pharmacy inventory connection, and end-to-end acceptance testing are still required before accepting real requests or payments. Medicine listings are not fabricated; the app shows setup messaging until the real catalogue is wired.

## Deployment

The app builds to `dist/`. It can be deployed to a static host that supports Vite assets. Configure environment variables in the deployment environment; do not commit real secrets or private credentials.
