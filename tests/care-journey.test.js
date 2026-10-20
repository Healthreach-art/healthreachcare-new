import test from "node:test";
import assert from "node:assert/strict";
import {
  appendStatusHistory,
  canMessageBooking,
  canReviewBooking,
  configuredHomecareFee,
  configuredHomecarePrice,
  createBookingMessage,
  createBookingReview,
  createPreviewNotification,
  markNotificationRead,
  readCareJourney,
  recordCareEvent,
  toggleFavourite
} from "../src/care-journey.js";

class MemoryStorage {
  constructor() { this.data = new Map(); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key, value) { this.data.set(key, String(value)); }
}

test("homecare prices must be explicitly configured and positive", () => {
  assert.equal(configuredHomecarePrice("personal_care", {}), null);
  assert.equal(configuredHomecarePrice("personal_care", { VITE_HOMECARE_PRICE_PERSONAL_CARE_2H: "0" }), null);
  assert.equal(configuredHomecarePrice("personal_care", { VITE_HOMECARE_PRICE_PERSONAL_CARE_2H: "not-a-price" }), null);
  assert.equal(configuredHomecarePrice("personal_care", { VITE_HOMECARE_PRICE_PERSONAL_CARE_2H: "499.995" }), 500);
  assert.equal(configuredHomecarePrice("personal_care", { VITE_HOMECARE_PRICE_PERSONAL_CARE_8H: "999" }, "8"), 999);
  assert.equal(configuredHomecarePrice("personal_care", { VITE_HOMECARE_PRICE_PERSONAL_CARE_2H: "100" }, "3"), null);
  assert.equal(configuredHomecarePrice("unknown", { VITE_HOMECARE_PRICE_PERSONAL_CARE_2H: "100" }), null);
  assert.equal(configuredHomecareFee("service", {}), null);
  assert.equal(configuredHomecareFee("service", { VITE_HOMECARE_SERVICE_FEE: "0" }), 0);
  assert.equal(configuredHomecareFee("travel", { VITE_HOMECARE_TRAVEL_FEE: "25" }), 25);
});

test("chat requires an active booking and an assigned provider", () => {
  assert.equal(canMessageBooking({ id: "B1", status: "accepted", providerId: "P1" }), true);
  assert.equal(canMessageBooking({ id: "B1", status: "pending" }), false);
  assert.equal(canMessageBooking({ id: "B1", status: "completed", providerId: "P1" }), false);
  assert.throws(() => createBookingMessage({ id: "B1", status: "pending" }, "patient-1", "Hello"), /active booking/);
  const message = createBookingMessage({ id: "B1", status: "accepted", providerId: "P1" }, "patient-1", "Hello", "2026-10-20T08:00:00.000Z");
  assert.equal(message.bookingId, "B1");
  assert.equal(message.testOnly, true);
});

test("reviews require a completed booking and are unique per booking", () => {
  const booking = { id: "B2", status: "completed", providerId: "P2" };
  assert.equal(canReviewBooking({ ...booking, status: "accepted" }, []), false);
  assert.equal(canReviewBooking(booking, []), true);
  const review = createBookingReview(booking, 5, "Good support", [], "2026-10-20T08:00:00.000Z");
  assert.equal(review.rating, 5);
  assert.equal(canReviewBooking(booking, [review]), false);
  assert.throws(() => createBookingReview(booking, 6, "", []), /rating/);
});

test("status history preserves earlier transitions with timestamps", () => {
  const first = appendStatusHistory({ id: "B3" }, "awaiting_payment", "2026-10-20T08:00:00.000Z");
  const second = appendStatusHistory(first, "accepted", "2026-10-20T09:00:00.000Z");
  assert.equal(second.statusHistory.length, 2);
  assert.equal(second.statusHistory[0].status, "awaiting_payment");
  assert.equal(second.statusHistory[1].status, "accepted");
  assert.equal(second.updatedAt, "2026-10-20T09:00:00.000Z");
});

test("notifications are created from explicit events and can be marked read", () => {
  const notification = createPreviewNotification({ type: "provider_accepted", title: "Provider accepted", bookingId: "B4" }, "2026-10-20T08:00:00.000Z");
  assert.equal(notification.unread, true);
  assert.equal(markNotificationRead(notification, "2026-10-20T08:05:00.000Z").unread, false);
  assert.equal(markNotificationRead(notification, "2026-10-20T08:05:00.000Z").readAt, "2026-10-20T08:05:00.000Z");
  assert.throws(() => createPreviewNotification({ type: "other" }), /reference/);
});

test("favourites toggle without creating bookings", () => {
  const provider = { id: "P5", name: "Test provider", kind: "homecare" };
  const saved = toggleFavourite([], provider);
  assert.equal(saved.length, 1);
  assert.equal(saved[0].id, "P5");
  assert.equal(toggleFavourite(saved, provider).length, 0);
});

test("journey storage contains only explicitly test-marked records", () => {
  const storage = new MemoryStorage();
  recordCareEvent({ type: "booking_created", title: "Test booking created", message: "Preview only", bookingId: "B6", at: "2026-10-20T08:00:00.000Z" }, storage);
  const state = readCareJourney(storage);
  assert.equal(state.events.length, 1);
  assert.equal(state.notifications.length, 1);
  assert.equal(state.notifications[0].bookingId, "B6");
  storage.setItem("healthreachcare-care-journey-v1", JSON.stringify({ messages: [{ id: "unsafe", testOnly: false }], notifications: [{ id: "unsafe", testOnly: false }] }));
  const filtered = readCareJourney(storage);
  assert.equal(filtered.messages.length, 0);
  assert.equal(filtered.notifications.length, 0);
});
