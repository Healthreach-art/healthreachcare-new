# HealthReachCare low-cost production plan

## Cost policy

Use free tiers while validating the product, avoid paid infrastructure unless real traffic requires it, and never choose a provider based only on the word free: check usage limits, inactivity pauses, regional availability, data export, and payment transaction fees. Do not enable billing or accept paid production traffic without the owner's approval.

## Backend options to evaluate before migrating away from Firebase

**Preferred candidate: Supabase Free + Cloudflare Workers/Pages Free.**
- Supabase can provide Postgres, authentication, and row-level security in one service.
- Cloudflare Pages/Workers can host the web app and small server-side endpoints within published free quotas.
- Keep payment secrets in a server-side Worker secret store, never in VITE_ browser variables.
- Use database migrations and RLS policies for patient/provider/admin isolation.
- Recheck current limits and whether the intended region/features are available before committing to the migration. Free plans can pause projects or impose quotas.

**Alternative: keep Firebase temporarily on its no-cost allowances.**
- This avoids a risky immediate rewrite while the existing patient request flow is being developed.
- Firebase web config is public client configuration, not a secret; service-account keys and payment secrets must never be committed.
- Confirm the intended Firebase project's current plan, quotas, billing status, and Firestore rules before production use.

Do not operate two databases as competing sources of truth. If migration is approved, do it as a deliberate branch with schema mapping, authentication migration plan, security-policy tests, and rollback instructions.

## Real workflows required before launch

1. Provider identity and credential application; admin review; approval/rejection and audit trail.
2. Patient request creation and history.
3. Admin assignment to an approved provider.
4. Role-scoped doctor, pharmacy, and homecare queues.
5. Server-enforced status transitions and patient notifications.
6. Pharmacy catalogue, stock reservation, prescription review, fulfilment, and cancellation/refund rules.
7. Payment initiation and server-side provider webhook signature validation; only verified callbacks may mark a payment paid.
8. Automated tests for patient/provider/admin access, cross-account denial, duplicate events, and failed payments.

## Payment safety

The browser must never mark a payment as paid. A production payment integration needs a server-side endpoint, a payment provider account, webhook signature verification, idempotency, persistent payment/order linkage, and reconciliation. Use provider test mode first. Until this exists, show payment as NOT ENABLED rather than claiming success or collecting real card/bank details.

## Current implementation status

The current feature branch still uses Firebase Authentication and Firestore. It now contains an initial role-gated assigned-request workspace, but it is not a complete provider/verification/payment implementation. No backend migration, Firestore deployment, real payment, or production acceptance test is claimed by this document.