/**
 * Care journey domain helpers.
 *
 * The current app is a browser-only preview. These helpers deliberately mark
 * every locally-created event as test-only; they are NOT an authorization,
 * payment-verification, persistence, or production security boundary.
 */
export const CARE_JOURNEY_KEY = "healthreachcare-care-journey-v1";

export const CLOSED_BOOKING_STATUSES = new Set([
  "completed", "delivered", "cancelled", "canceled", "declined", "rejected",
  "refunded", "service_ended"
]);

export const HOMECARE_PRICE_ENV_KEYS = Object.freeze({
  personal_care: "VITE_HOMECARE_PRICE_PERSONAL_CARE",
  elderly_care: "VITE_HOMECARE_PRICE_ELDERLY_CARE",
  post_surgery: "VITE_HOMECARE_PRICE_POST_SURGERY",
  mobility: "VITE_HOMECARE_PRICE_MOBILITY",
  medication_support: "VITE_HOMECARE_PRICE_MEDICATION_SUPPORT",
  specialised_care: "VITE_HOMECARE_PRICE_SPECIALISED_CARE"
});

export function configuredHomecarePrice(serviceId, env = {}) {
  const key = HOMECARE_PRICE_ENV_KEYS[serviceId];
  if (!key) return null;
  const raw = env[key];
  if (raw === undefined || raw === null || String(raw).trim() === "") return null;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) / 100 : null;
}

export function formatZar(amount) {
  if (!Number.isFinite(Number(amount))) return "Price not configured";
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(Number(amount));
}

export function isBookingClosed(booking) {
  return CLOSED_BOOKING_STATUSES.has(String(booking?.status || booking?.requestStatus || "").toLowerCase());
}

export function canMessageBooking(booking) {
  const assigned = Boolean(booking?.providerId || booking?.doctorId || booking?.coordinatorId);
  return Boolean(booking?.id && assigned && !isBookingClosed(booking));
}

export function canReviewBooking(booking, reviews = []) {
  const completed = ["completed", "delivered"].includes(String(booking?.status || "").toLowerCase());
  return Boolean(booking?.id && completed && !reviews.some(review => review.bookingId === booking.id));
}

export function appendStatusHistory(record, status, at = new Date().toISOString(), extra = {}) {
  const previous = Array.isArray(record?.statusHistory) ? record.statusHistory : [];
  return {
    ...record,
    status,
    updatedAt: at,
    statusHistory: [...previous, { status, at, testOnly: true, ...extra }]
  };
}

export function createPreviewNotification(event, at = new Date().toISOString()) {
  if (!event || !event.type || !event.bookingId && !event.orderId) {
    throw new Error("A real test-workflow event and its booking/order reference are required.");
  }
  return {
    id: "TEST-NOTICE-" + at.replace(/[^0-9]/g, "").slice(0, 14) + "-" + Math.random().toString(36).slice(2, 7),
    type: event.type,
    title: String(event.title || "Care journey update"),
    message: String(event.message || "A test workflow status changed."),
    bookingId: event.bookingId || null,
    orderId: event.orderId || null,
    createdAt: at,
    readAt: null,
    unread: true,
    testOnly: true
  };
}

export function markNotificationRead(notification, at = new Date().toISOString()) {
  return { ...notification, unread: false, readAt: notification.readAt || at };
}

export function createBookingMessage(booking, senderId, body, at = new Date().toISOString()) {
  if (!canMessageBooking(booking)) {
    throw new Error("Messaging is available only for an active booking with an assigned provider.");
  }
  const message = String(body || "").trim();
  if (!message || message.length > 2000) {
    throw new Error("Enter a message of 1–2,000 characters.");
  }
  if (!senderId) throw new Error("A sender identity is required.");
  return {
    id: "TEST-MSG-" + at.replace(/[^0-9]/g, "").slice(0, 14) + "-" + Math.random().toString(36).slice(2, 7),
    bookingId: booking.id,
    senderId,
    body: message,
    createdAt: at,
    testOnly: true
  };
}

export function createBookingReview(booking, rating, comment, existingReviews = [], at = new Date().toISOString()) {
  if (!canReviewBooking(booking, existingReviews)) {
    throw new Error("Reviews are available once per completed booking only.");
  }
  const score = Number(rating);
  if (!Number.isInteger(score) || score < 1 || score > 5) {
    throw new Error("Choose a rating from 1 to 5.");
  }
  const text = String(comment || "").trim();
  if (text.length > 1500) throw new Error("Reviews must be 1,500 characters or fewer.");
  return {
    id: "TEST-REVIEW-" + at.replace(/[^0-9]/g, "").slice(0, 14) + "-" + Math.random().toString(36).slice(2, 7),
    bookingId: booking.id,
    providerId: booking.providerId || booking.doctorId || booking.coordinatorId || null,
    rating: score,
    comment: text,
    createdAt: at,
    testOnly: true
  };
}

export function toggleFavourite(favourites, provider) {
  if (!provider?.id) throw new Error("A provider identifier is required to save a favourite.");
  const current = Array.isArray(favourites) ? favourites : [];
  const exists = current.some(item => item.id === provider.id);
  return exists ? current.filter(item => item.id !== provider.id) : [
    ...current,
    { id: provider.id, name: String(provider.name || "Provider name unavailable"), kind: provider.kind || "care", savedAt: new Date().toISOString(), testOnly: true }
  ];
}

export function createCareJourneyState() {
  return { version: 1, notifications: [], messages: [], reviews: [], favourites: [], events: [], updatedAt: new Date().toISOString() };
}

export function readCareJourney(storage = typeof window !== "undefined" ? window.localStorage : null) {
  const empty = createCareJourneyState();
  if (!storage) return empty;
  try {
    const parsed = JSON.parse(storage.getItem(CARE_JOURNEY_KEY) || "null");
    if (!parsed || typeof parsed !== "object") return empty;
    return {
      ...empty,
      ...parsed,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications.filter(item => item.testOnly === true) : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages.filter(item => item.testOnly === true) : [],
      reviews: Array.isArray(parsed.reviews) ? parsed.reviews.filter(item => item.testOnly === true) : [],
      favourites: Array.isArray(parsed.favourites) ? parsed.favourites.filter(item => item.testOnly === true) : [],
      events: Array.isArray(parsed.events) ? parsed.events.filter(item => item.testOnly === true) : []
    };
  } catch {
    return empty;
  }
}

export function writeCareJourney(next, storage = typeof window !== "undefined" ? window.localStorage : null) {
  if (!storage) throw new Error("Care journey preview storage is unavailable.");
  const state = { ...createCareJourneyState(), ...next, updatedAt: new Date().toISOString() };
  storage.setItem(CARE_JOURNEY_KEY, JSON.stringify(state));
  if (typeof window !== "undefined" && storage === window.localStorage) {
    window.dispatchEvent(new CustomEvent("healthreachcare-care-journey-updated", { detail: state }));
  }
  return state;
}

export function recordCareEvent(event, storage = typeof window !== "undefined" ? window.localStorage : null) {
  const state = readCareJourney(storage);
  const at = event.at || new Date().toISOString();
  const entry = { ...event, at, testOnly: true };
  const next = {
    ...state,
    events: [entry, ...state.events],
    notifications: [createPreviewNotification({
      type: entry.type,
      title: entry.title,
      message: entry.message,
      bookingId: entry.bookingId,
      orderId: entry.orderId
    }, at), ...state.notifications]
  };
  return writeCareJourney(next, storage);
}
