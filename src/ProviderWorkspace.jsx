import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, CreditCard, House, ShieldCheck, Stethoscope, XCircle } from "lucide-react";

const STORAGE_KEY = "healthreachcare-test-bookings";
const readRequests = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
};
const readable = value => String(value || "").replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const formatDate = value => value ? new Date(value).toLocaleString() : "Not specified";

export default function ProviderWorkspace({ role = "doctor", onBack }) {
  const [requests, setRequests] = useState(readRequests);
  const [filter, setFilter] = useState("pending");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    const refresh = () => setRequests(readRequests());
    window.addEventListener("storage", refresh);
    window.addEventListener("healthreachcare-test-bookings-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("healthreachcare-test-bookings-updated", refresh);
    };
  }, []);

  const allRequests = requests.filter(item => item.kind === (role === "doctor" ? "appointment" : "homecare") && String(item.providerId || "").startsWith(role === "doctor" ? "demo-doctor-provider" : "demo-homecare-provider"));
  const visible = allRequests.filter(item => filter === "all" || (filter === "pending" ? ["pending", "requested"].includes(String(item.status || item.requestStatus).toLowerCase()) : String(item.status || item.requestStatus).toLowerCase() === filter));
  const updateRequest = (item, status) => {
    setBusyId(item.id); setNotice(""); setError("");
    try {
      const current = readRequests();
      const expectedPrefix = role === "doctor" ? "demo-doctor-provider" : "demo-homecare-provider";
      const target = current.findIndex(row => row.id === item.id && String(row.providerId || "").startsWith(expectedPrefix) && row.kind === (role === "doctor" ? "appointment" : "homecare"));
      if (target < 0) throw new Error("This test request is no longer available.");
      if (!["pending", "requested"].includes(String(current[target].status || current[target].requestStatus).toLowerCase())) throw new Error("This request has already been actioned.");
      current[target] = { ...current[target], status, requestStatus: status, providerResponseAt: new Date().toISOString() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      window.dispatchEvent(new CustomEvent("healthreachcare-test-bookings-updated"));
      setRequests(current);
      setNotice(status === "accepted" ? "Test request accepted. The patient dashboard can see this status in this browser. No real booking or payment is confirmed." : "Test request declined. No real provider was contacted.");
    } catch (e) { setError(e.message || "Could not update this test request."); }
    finally { setBusyId(""); }
  };

  const pendingCount = allRequests.filter(r => ["pending", "requested"].includes(String(r.status || r.requestStatus).toLowerCase())).length;
  const acceptedUnpaid = allRequests.filter(r => String(r.status || r.requestStatus).toLowerCase() === "accepted" && r.paymentStatus !== "paid").length;

  return <section className="page-content provider-workspace">
    <div className="eyebrow">LOCAL TEST MODE · PROVIDER PORTAL</div>
    <h1>{role === "doctor" ? "Doctor workspace" : "Homecare provider workspace"}</h1>
    <p className="lead">Test how patient requests arrive, and accept or decline them. These demo portals are not authenticated and must never be used for real patient data.</p>
    <div className="booking-test-banner"><ShieldCheck size={18}/><span><strong>Browser-only testing:</strong> requests are stored in this browser's local storage. They are not shared with another device or browser and do not contact real providers. Do not enter sensitive medical information.</span></div>
    <div className="provider-summary">
      <div className="provider-stat"><span>{role === "doctor" ? <Stethoscope/> : <House/>}</span><strong>{allRequests.length}</strong><small>Total test requests</small></div>
      <div className="provider-stat"><span><Clock3/></span><strong>{pendingCount}</strong><small>Awaiting review</small></div>
      <div className="provider-stat"><span><CreditCard/></span><strong>{acceptedUnpaid}</strong><small>Accepted; payment not connected</small></div>
    </div>
    {notice && <div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span></div>}
    {error && <div className="state-card state-error"><AlertCircle/><div><strong>Could not update</strong><p>{error}</p></div></div>}
    <div className="provider-toolbar"><h2>Incoming requests</h2><select aria-label="Filter requests" value={filter} onChange={e => setFilter(e.target.value)}><option value="pending">Awaiting review</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="all">All requests</option></select></div>
    {visible.length ? <div className="provider-request-list">{visible.map(item => {
      const status = String(item.status || item.requestStatus || "pending").toLowerCase();
      const pending = ["pending", "requested"].includes(status);
      return <article className="provider-request-card" key={item.id}>
        <div className="provider-request-head"><div><span className="provider-request-type">{role === "doctor" ? "DOCTOR APPOINTMENT" : "HOMECARE REQUEST"}</span><h3>{item.patientName || "Test patient"}</h3><p>{item.patientPhone || "No phone supplied"} · {item.location || "Location not supplied"}</p></div><span className={"request-status status-" + status}>{readable(status)}</span></div>
        <div className="provider-request-details">
          {role === "doctor" ? <p><strong>Consultation:</strong> {item.consultationMode || "Not specified"}</p> : <p><strong>Service:</strong> {item.serviceType || "Not specified"} · {item.duration || "Not specified"}</p>}
          <p><strong>Requested:</strong> {item.requestedDate || "Date not specified"} {item.requestedTime || ""}</p>
          <p><strong>Submitted:</strong> {formatDate(item.createdAt)}</p>
          <p><strong>Details:</strong> {item.details || "No additional details"}</p>
          <p><strong>Fixed service price:</strong> {role === "homecare" ? (typeof item.servicePrice === "number" ? "R" + item.servicePrice.toFixed(2) : "Not configured in preview") : (typeof item.consultationFee === "number" ? "Illustrative R" + item.consultationFee.toFixed(2) : "Not configured in preview")}</p>
          <p><strong>Payment:</strong> Not connected — this test portal never collects payment.</p>
        </div>
        {pending && <div className="provider-request-actions"><button className="button button-primary" disabled={Boolean(busyId)} onClick={() => updateRequest(item, "accepted")}>{busyId === item.id ? "Saving…" : <><CheckCircle2 size={16}/> Accept test request</>}</button><button className="button button-outline" disabled={Boolean(busyId)} onClick={() => updateRequest(item, "declined")}><XCircle size={16}/> Decline</button></div>}
        {status === "accepted" && <div className="inline-message"><CreditCard size={17}/><span>Accepted in test mode only. No payment was taken and no real appointment/service is confirmed.</span></div>}
      </article>;
    })}</div> : <div className="empty-state"><ClipboardFallback/><h3>No {filter === "pending" ? "pending " : ""}requests yet</h3><p>Submit a matching test booking from the patient dashboard. It will appear here when testing in the same browser.</p></div>}
    <button className="button button-outline" onClick={onBack}>Return to patient site</button>
  </section>;
}
function ClipboardFallback() { return <span aria-hidden="true" style={{display:"inline-block",fontSize:25}}>▤</span>; }
