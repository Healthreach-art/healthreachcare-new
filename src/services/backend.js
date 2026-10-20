/**
 * Backend boundary for HealthReachCare.
 *
 * This repository intentionally ships WITHOUT Firebase or another backend.
 * UI components should call this adapter rather than importing a vendor SDK.
 * When a backend is selected, implement these functions in a separate adapter
 * and keep secrets on a trusted server—not in Vite client environment values.
 */
const notConnected = () => Promise.reject(
  new Error("Backend not connected. This preview does not send or save data.")
);

export const backend = Object.freeze({
  auth: {
    getCurrentUser: notConnected,
    signIn: notConnected,
    signUp: notConnected,
    signOut: notConnected
  },
  doctors: {
    listVerified: notConnected,
    getAvailability: notConnected
  },
  bookings: {
    createAppointmentRequest: notConnected,
    createHomecareRequest: notConnected,
    getPatientRequests: notConnected
  },
  payments: {
    createCheckout: notConnected,
    getPaymentStatus: notConnected
  }
});
