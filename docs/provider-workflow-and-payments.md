# Provider workflow and payment readiness

## Current status

The new repository is a **front-end prototype only**. Firebase and all other backend integrations have been removed. No authentication, provider directory, booking persistence, notifications, or payment gateway is connected.

The doctor appointment and homecare screens are UI previews. They do not send or save booking requests. The UI must never imply a request was accepted, an appointment reserved, a provider assigned, or payment received.

## Intended doctor appointment journey

1. Connect a backend adapter for authenticated patient identity.
2. Load only active, approved and verified doctor records.
3. Retrieve real availability from the trusted scheduling service.
4. Let the patient select a provider, consultation mode and available slot.
5. Create the request server-side and reserve the slot transactionally.
6. Let the authorized provider/admin accept or decline the request.
7. Only after confirmation, initialize secure checkout if payment is required.
8. Mark paid only after trusted payment-provider verification.

## Intended homecare journey

1. Connect authenticated patient identity and load approved, verified homecare providers.
2. Let the patient select a service and enter address, preferred visit time and duration.
3. Load the configured fixed price for the selected service from trusted server-side pricing; never accept a client-supplied price. If no fixed price is configured, disable checkout.
4. Submit the request and assign/confirm an approved provider through authorized workflow.
5. Collect payment using secure checkout only after the final price and service are confirmed.
6. Mark paid only after verified payment callback/webhook processing.
7. Track provider acceptance, service progress and completion from trusted backend state.

## Security and payment requirements before production

- Enforce patient-owned records, role-based provider access and admin authorization on the server/backend.
- Never trust role names, prices, payment status, provider approval, availability, or booking status supplied by the browser.
- Keep privileged credentials and payment secrets on the server. Client-side Vite variables are public.
- Use transactional availability reservation and prevent double booking.
- Verify payment webhooks using the payment provider's documented signature scheme; make processing idempotent and validate amount, currency, reference and request ownership.
- Implement refunds, cancellations, audit records, failure recovery and tests.
- Configure and test the chosen backend's security policies against the actual deployment environment.

See [backend-integration.md](./backend-integration.md) for the vendor-neutral adapter contract. Firebase is only a possible future choice; it is not currently installed or configured.
