# HealthReachCare

Patient-facing HealthReachCare web app built with React, Vite, Lucide icons and responsive CSS.

## Local testing mode

The current patient UI is intentionally running without Firebase initialization so the screens can be tested without Firebase credentials, sign-in, or Firestore rules.

1. Install Node.js 20.19+ or 22.12+.
2. Install dependencies with `npm install`.
3. Run the automated domain tests with `npm test`.
4. Run the production build with `npm run build`.
5. Start the development server with `npm run dev`.
6. Open the local Vite URL shown in the terminal.

No `.env.local` or Firebase web configuration is required for this UI test.

## Booking flows in test mode

- Doctor booking: choose an illustrative sample doctor, select a consultation type and preferred date/time, submit a test request, then review it in the doctor test workspace.
- Homecare: select a service, duration, and visit details. Checkout is disabled until a fixed price for that exact service/duration and explicit service/travel fee values are configured. Even with configured prices, this preview cannot take payment or create a homecare booking.
- Configure `VITE_HOMECARE_PRICE_<SERVICE>_<DURATION>H` for each service/duration in `.env.example`, and set both `VITE_HOMECARE_SERVICE_FEE` and `VITE_HOMECARE_TRAVEL_FEE`. Set a fee to `0` explicitly when it does not apply. Do not guess or publish prices before they are approved.
- Sample practitioners, catalogue items, stock levels, doctor fees and medicine delivery charges are illustrative test fixtures only. They are not real providers, pharmacy inventory, availability or production prices.
- The patient medicine page opens the test catalogue and mock checkout workflow. Test orders and test stock changes are shared with pharmacy/driver demo workspaces in the same browser origin.
- Test requests may be saved to this browser's local storage under `healthreachcare-test-bookings`; the care journey's preview events, messages, reviews, favourites and notifications are stored under `healthreachcare-care-journey-v1`.
- Requests are **not** sent to doctors, clinics, pharmacies, drivers or homecare providers. Sample doctor selection is not a live directory and availability is not checked. Medicine checkout can record a clearly labelled test authorisation only; no payment is collected.
- Activities now show saved status history where present. Preview chat is booking-linked and gated on provider acceptance, reviews are limited to completed bookings and one review per booking, and favourites never create a booking. These records stay on this device; no provider receives messages and no public provider profile is updated.
- The header has no sidebar/dropdown navigation. The patient bottom navigation is Home, Activities and Account. The patient home does not show the browser-local test bookings panel, delivery-tracker placeholder, or recent-order-history placeholder.

## Before production

Before production, implement and verify authenticated Firebase/Auth/Firestore server-side access control, provider assignment, live availability/booking locks, private prescription storage, real-time shared booking chat, provider favourites linked to a verified directory, published reviews with duplicate prevention, notification delivery and unread state, genuine driver-location updates, cancellation/reassignment/refund rules, and a server-verified payment provider/webhook with idempotency and audit logs. The current localStorage data is for preview only and is not a production source of truth. Payment secrets must never use `VITE_` variables or be exposed to the browser. Apply POPIA safeguards, access logging, retention/deletion rules, and privacy notices before handling real health information. Do not represent local test requests or sample prices as real bookings or live prices. Homecare checkout remains disabled if any required price or fee is missing.

The app builds to `dist/` and can be deployed to a static host that supports Vite assets.