# HealthReachCare

Patient-facing HealthReachCare React/Vite app with a public, open-access test landing page.

## Test environment

This build is for product walkthroughs and workflow testing only. No login is required to open the Patient, Doctor, Pharmacy, Driver, or Admin test workspaces.

1. Install Node.js 20.19+ or 22.12+.
2. Run `npm install`.
3. Run `npm run dev`.
4. Open the local Vite URL shown in the terminal.

The active test flow does not initialise Firebase and does not require Firebase web configuration. The old Firebase-based provider source file is retained as legacy code, but it is not used by the active open test workspaces.

## Connected pharmacy test flow

- Patient can browse the explicitly labelled sample catalogue, adjust quantities, choose delivery or pickup, enter test contact details, and create a test order.
- Checkout presents a realistic payment-method selection and a test-authorisation action. No real card details are requested, no payment provider is called, and no real money moves.
- The pharmacy workspace receives the order in the same browser origin, can accept it, update test inventory, prepare the order, and mark it ready for delivery.
- Test stock is deducted once when the pharmacy starts preparation. The order cannot enter preparation unless a test authorisation exists.
- The driver workspace sees delivery-ready orders and can mark them out for delivery and delivered.
- The patient order history, pharmacy queue, driver queue, and admin ledger use the shared local test store.
- Doctor and home-care booking requests created in the patient flow appear in the doctor test workspace.

## Data and security limitations

- This is **not production-ready**. The role pages are intentionally open and do not provide authentication, authorisation, or tenant isolation.
- Shared workflow data is stored in browser local storage. It syncs across tabs using the same browser origin, but **not across different devices, browsers, or users**.
- All catalogue items, inventory counts, fees, test orders, and payment authorisations are sample/test data. Do not enter real patient information or treat the catalogue as a real pharmacy.
- A simulated test authorisation is never a real paid status. Real payment processing still requires a payment-provider integration, server-side payment initiation, signature-verified webhook, and reconciliation.
- Before production, restore secure authentication and role-based access; move orders, inventory, booking requests and payments to a trusted shared backend; validate pharmacy/provider assignments; and perform real end-to-end tests.
