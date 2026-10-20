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


## Courier delivery demo

The driver demo adapter is `src/services/driver-delivery-demo.js`. It uses synthetic browser-only workflow records and is not a production authorization or cross-device synchronization mechanism. See `docs/driver-delivery-demo.md` for the operation contract and production server requirements.
