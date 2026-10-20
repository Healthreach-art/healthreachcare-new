# Backend integration boundary

This repository is intentionally a front-end prototype with **no Firebase SDK and no active backend**.

## Architecture

UI components should depend on `src/services/backend.js`, not import a provider SDK directly. The adapter currently rejects calls with a clear “Backend not connected” error, so the app cannot silently pretend a booking or payment succeeded.

The adapter defines the intended contract:
- Authentication: current user, sign in, sign up, sign out
- Doctors: verified directory and real availability
- Bookings: appointment/homecare requests and patient request history
- Payments: secure checkout initialization and verified status retrieval

## When a backend is chosen

1. Select and explicitly configure the backend (Firebase is one possible future option, not a current dependency).
2. Implement the adapter functions in a provider-specific module.
3. Keep privileged credentials and payment secrets on trusted server-side code. Vite variables are public client configuration, not secret storage.
4. Define and test authorization rules, account roles, provider verification, booking ownership, and status transitions.
5. Implement server-side availability reservation, homecare pricing, payment webhooks and idempotent confirmation before showing bookings as confirmed or paid.
6. Add automated tests and verify production build before deployment.

## Current behavior

- No accounts are created or authenticated.
- No doctor/provider records are loaded; no fake provider profiles are displayed.
- Booking forms are local UI previews only and do not persist or send entered information.
- No payment or checkout is available.
- Do not deploy this as a live booking system until a backend adapter and server-side workflows are implemented and tested.

## Driver delivery workflow

Driver dispatch is not connected to a live backend. The test workflow stores test orders, simulated payment authorisations, and status updates in browser `localStorage`; it is not shared Firestore state and does not provide authentication, concurrency control, or a trusted audit trail. The current test transition from `ready_for_delivery` to `out_for_delivery` does not assign or claim a driver, and the transition to `delivered` does not verify pickup or recipient handover. These actions must remain clearly identified as test-only.

Before enabling real dispatch:

1. Add a backend adapter for listing eligible delivery orders and for claiming an order and advancing its delivery status. Use the existing order records and status definitions; do not create a separate driver copy of the order.
2. Verify Firebase Authentication identity and approved-driver status on every server-side operation. Enforce access in Firestore rules and the trusted operation, not only in the client UI. A driver may read and update only deliveries they are authorised to claim or that are assigned to them.
3. Claim and transition orders transactionally against the expected current status and assignment. Reject stale or invalid transitions; persist the driver assignment, acceptance, pickup, dispatch, and delivery timestamps as applicable. Make retries idempotent and retain the pharmacy's fulfilment state consistently.
4. Define and enforce the handover requirements before accepting a `delivered` transition. Return explicit errors for rejected transitions and surface loading, empty, retry, and failure states in the client.
5. Keep payment, inventory, and unrelated order fields outside driver write permissions. The illustrative test delivery fee and test payment authorisation are not collected funds, a verified fee, or settled earnings. Show earnings only after an attributable persisted payment/settlement record exists; no such production settlement integration is configured here.
6. Treat the courier map as a visual preview until a real, consented location and mapping integration is configured. Do not show generated driver positions, routes, or navigation as live data.

This repository currently has no Firebase SDK/configuration, Firestore rules, Cloudflare Worker, driver approval records, or production order/payment backend to implement or verify these controls against. Firebase project configuration, security rules, a trusted Workers-compatible operation, approved-driver data, and payment/settlement integration must be provided and tested before live delivery access can be enabled. Do not add `firebase-admin` to the client or treat browser-local test data as real dispatch.
