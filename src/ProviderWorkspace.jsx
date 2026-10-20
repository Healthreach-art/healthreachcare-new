import { useEffect, useState } from "react";
import {
  addDoc, collection, doc, getDoc, onSnapshot, query, runTransaction,
  serverTimestamp, where
} from "firebase/firestore";
import {
  AlertCircle, CheckCircle2, Clock3, RefreshCw, ShieldCheck,
  Stethoscope, House, CreditCard, XCircle
} from "lucide-react";
import { db } from "./firebase";

const readable = value => String(value || "").replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const asDate = value => value?.toDate ? value.toDate().toLocaleString() : value || "Not specified";

export default function ProviderWorkspace({ user, onBack }) {
  const [roleState, setRoleState] = useState("loading");
  const [role, setRole] = useState("");
  const [profileId, setProfileId] = useState("");
  const [error, setError] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [homecareRequests, setHomecareRequests] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    let cancelled = false;
    async function resolveRole() {
      if (!db || !user) { setRoleState("unavailable"); return; }
      try {
        const [roleSnap, profileSnap] = await Promise.all([
          getDoc(doc(db, "user_roles", user.uid)),
          getDoc(doc(db, "profiles", user.uid))
        ]);
        const roleData = roleSnap.exists() ? roleSnap.data() : {};
        const profileData = profileSnap.exists() ? profileSnap.data() : {};
        const normalizedRole = String(roleData.role || roleData.roleName || profileData.role || profileData.accountType || "").toLowerCase();
        const kind = String(roleData.providerType || roleData.serviceType || profileData.providerType || "").toLowerCase();
        const resolved = /doctor|practitioner/.test(normalizedRole) ? "doctor"
          : /home.?care|nurse|caregiver/.test(normalizedRole) || /home.?care|nurse|caregiver/.test(kind) ? "homecare"
          : /provider/.test(normalizedRole) && /doctor|practitioner/.test(kind) ? "doctor"
          : /provider/.test(normalizedRole) && /home.?care|nurse|caregiver/.test(kind) ? "homecare" : "";
        if (!cancelled) {
          setRole(resolved);
          setProfileId(String(roleData.providerId || roleData.profileId || profileData.providerId || profileData.doctorId || user.uid));
          setRoleState(resolved ? "ready" : "denied");
        }
      } catch (e) {
        if (!cancelled) {
          setRoleState("error");
          setError(e?.code === "permission-denied"
            ? "Your account cannot read its provider role. Ask an administrator to configure secure access to user_roles and profiles."
            : "We couldn't verify your provider access. Check the connection and try again.");
        }
      }
    }
    resolveRole();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!db || roleState !== "ready" || !user) return;
    const unsubs = [];
    const handleError = e => setError(e?.code === "permission-denied"
      ? "Firestore denied access. Provider-only rules must allow this verified provider to read only requests assigned to them."
      : "A request list could not be loaded. Please retry.");
    if (role === "doctor") {
      const ids = [...new Set([user.uid, profileId].filter(Boolean))];
      const rows = new Map();
      ids.forEach(id => {
        const q = query(collection(db, "appointments"), where("doctorId", "==", id));
        unsubs.push(onSnapshot(q, snap => {
          snap.docs.forEach(d => rows.set(d.id, { id: d.id, kind: "appointment", ...d.data() }));
          setAppointments([...rows.values()]);
          setError("");
        }, handleError));
      });
    }
    if (role === "homecare") {
      const q = query(collection(db, "homecareRequests"), where("providerUid", "==", user.uid));
      unsubs.push(onSnapshot(q, snap => {
        setHomecareRequests(snap.docs.map(d => ({ id: d.id, kind: "homecare", ...d.data() })));
        setError("");
      }, handleError));
    }
    return () => unsubs.forEach(unsub => unsub());
  }, [roleState, role, profileId, user]);

  const actOnRequest = async (item, action) => {
    if (!db || !user || busyId) return;
    setBusyId(item.id);
    setNotice("");
    setError("");
    try {
      const ref = doc(db, item.kind === "appointment" ? "appointments" : "homecareRequests", item.id);
      await runTransaction(db, async transaction => {
        const snap = await transaction.get(ref);
        if (!snap.exists()) throw new Error("This request no longer exists.");
        const current = snap.data();
        const isAssigned = item.kind === "appointment"
          ? [user.uid, profileId].includes(String(current.doctorId || ""))
          : current.providerUid === user.uid;
        if (!isAssigned) throw new Error("This request is not assigned to your provider account.");
        if (!["pending", "requested"].includes(String(current.requestStatus || current.status || "").toLowerCase())) {
          throw new Error("This request has already been actioned. Refresh the list to see its current status.");
        }
        transaction.update(ref, {
          status: action === "accept" ? "accepted" : "declined",
          requestStatus: action === "accept" ? "accepted" : "declined",
          acceptedBy: action === "accept" ? user.uid : null,
          acceptedAt: action === "accept" ? serverTimestamp() : null,
          declinedBy: action === "decline" ? user.uid : null,
          declinedAt: action === "decline" ? serverTimestamp() : null,
          updatedAt: serverTimestamp(),
          paymentStatus: action === "accept" ? (current.paymentStatus || "not_started") : (current.paymentStatus || "not_started")
        });
      });
      const patientUid = item.patientUid;
      if (patientUid) {
        try {
          await addDoc(collection(db, "users", patientUid, "notifications"), {
            title: action === "accept" ? "Provider accepted your request" : "Provider declined your request",
            message: action === "accept"
              ? "Your request has been accepted. Any required payment must be completed through the secure HealthReachCare checkout before paid services are confirmed."
              : "Your provider could not accept this request. Please return to HealthReachCare to choose another available option.",
            requestId: item.id,
            requestType: item.kind,
            createdAt: serverTimestamp(),
            read: false
          });
        } catch {
          // Request state is authoritative; a notification permission issue must not undo the provider's decision.
        }
      }
      setNotice(action === "accept"
        ? "Request accepted. No payment was collected. The secure checkout is not configured in this app yet, so do not treat this as a paid or fully confirmed booking."
        : "Request declined. The patient will need to select another provider or time.");
    } catch (e) {
      setError(e?.message || "We couldn't update this request. No status change was confirmed.");
    } finally {
      setBusyId("");
    }
  };

  if (!user) return <section className="page-content"><div className="state-card state-error"><ShieldCheck/><div><strong>Provider sign-in required</strong><p>Sign in with the provider account assigned to these requests.</p><button className="button button-outline" onClick={onBack}>Back to patient site</button></div></div></section>;
  if (roleState === "loading") return <section className="page-content"><div className="state-card"><RefreshCw className="spin"/><div><strong>Verifying provider access</strong><p>Checking your signed-in account's role.</p></div></div></section>;
  if (roleState === "unavailable") return <section className="page-content"><div className="state-card state-error"><AlertCircle/><div><strong>Provider workspace unavailable</strong><p>Firebase must be configured and you must be signed in.</p><button className="button button-outline" onClick={onBack}>Back to patient site</button></div></div></section>;
  if (roleState === "denied") return <section className="page-content"><div className="eyebrow">PROVIDER PORTAL</div><h1>Provider access required</h1><p className="lead">This workspace is restricted to accounts with an explicitly configured doctor or home-care provider role.</p><div className="state-card state-error"><ShieldCheck/><div><strong>No provider role found</strong><p>Ask the HealthReachCare administrator to verify your account and configure its role in user_roles or profiles. Access is not granted based on a self-selected role.</p><button className="button button-outline" onClick={onBack}>Back to patient site</button></div></div></section>;

  const allRequests = role === "doctor" ? appointments : homecareRequests;
  const visible = allRequests.filter(item => filter === "all" || (filter === "pending" ? ["pending", "requested"].includes(String(item.requestStatus || item.status || "").toLowerCase()) : String(item.requestStatus || item.status || "").toLowerCase() === filter));
  const acceptedUnpaid = allRequests.filter(item => String(item.requestStatus || item.status || "").toLowerCase() === "accepted" && !["paid", "succeeded"].includes(String(item.paymentStatus || "").toLowerCase()));

  return <section className="page-content provider-workspace">
    <div className="eyebrow">SECURE PROVIDER PORTAL</div>
    <h1>{role === "doctor" ? "Doctor workspace" : "Home-care workspace"}</h1>
    <p className="lead">Review requests assigned to your verified provider account. Patient requests remain unconfirmed until your workflow and any required payment are complete.</p>
    <div className="provider-summary">
      <div className="provider-stat"><span>{role === "doctor" ? <Stethoscope/> : <House/>}</span><strong>{allRequests.length}</strong><small>Total assigned requests</small></div>
      <div className="provider-stat"><span><Clock3/></span><strong>{allRequests.filter(r => ["pending","requested"].includes(String(r.requestStatus || r.status || "").toLowerCase())).length}</strong><small>Awaiting your review</small></div>
      <div className="provider-stat"><span><CreditCard/></span><strong>{acceptedUnpaid.length}</strong><small>Accepted; payment unresolved</small></div>
    </div>
    <div className="provider-security-note"><ShieldCheck size={18}/><span>Only requests assigned to this account should be returned by Firestore security rules. Never rely on client-side filtering as an access-control boundary.</span></div>
    {notice && <div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span></div>}
    {error && <div className="state-card state-error"><AlertCircle/><div><strong>Workspace issue</strong><p>{error}</p></div></div>}
    <div className="provider-toolbar"><h2>Requests</h2><select aria-label="Filter requests" value={filter} onChange={e => setFilter(e.target.value)}><option value="pending">Awaiting review</option><option value="accepted">Accepted</option><option value="declined">Declined</option><option value="all">All assigned</option></select></div>
    {visible.length ? <div className="provider-request-list">{visible.map(item => {
      const status = String(item.requestStatus || item.status || "pending").toLowerCase();
      const pending = ["pending","requested"].includes(status);
      return <article className="provider-request-card" key={item.id}>
        <div className="provider-request-head"><div><span className="provider-request-type">{item.kind === "appointment" ? "DOCTOR APPOINTMENT" : "HOME-CARE REQUEST"}</span><h3>{item.patientName || "Patient"} </h3><p>{item.patientPhone || "No phone supplied"} · {item.location || "Location not supplied"}</p></div><span className={"request-status status-" + status}>{readable(status)}</span></div>
        <div className="provider-request-details">
          {item.kind === "appointment" && <p><strong>Consultation:</strong> {item.consultationMode || "Not specified"}</p>}
          {item.kind === "homecare" && <p><strong>Service:</strong> {item.serviceType || "Not specified"} · {item.duration || "Duration to discuss"}</p>}
          <p><strong>Requested:</strong> {item.requestedDate || "Date not specified"} {item.requestedTime || ""}</p>
          <p><strong>Details:</strong> {item.details || "No additional details"}</p>
          <p><strong>Payment:</strong> {readable(item.paymentStatus || "not started")} — no payment is recorded by this workspace.</p>
        </div>
        {pending && <div className="provider-request-actions"><button className="button button-primary" disabled={Boolean(busyId)} onClick={() => actOnRequest(item, "accept")}>{busyId === item.id ? "Saving…" : <><CheckCircle2 size={16}/> Accept request</>}</button><button className="button button-outline" disabled={Boolean(busyId)} onClick={() => actOnRequest(item, "decline")}><XCircle size={16}/> Decline</button></div>}
        {status === "accepted" && <div className="inline-message"><CreditCard size={17}/><span>Accepted, but payment checkout is not configured. Do not collect card details here or mark this request paid manually.</span></div>}
      </article>;
    })}</div> : <div className="empty-state"><ClipboardListFallback/><h3>No matching assigned requests</h3><p>New requests appear here only when they are assigned to your provider account and permitted by Firestore rules.</p></div>}
    <div className="panel"><div className="panel-heading"><div className="panel-icon blue"><CreditCard/></div><div><h2>Secure payments</h2><p>Checkout and settlement status</p></div></div><div className="inline-message"><AlertCircle size={18}/><span>Payment processing is intentionally unavailable until a trusted server endpoint, payment-provider secret, signature-verified webhook, and server-side order/request reconciliation are configured. No card data is collected here.</span></div></div>
    <button className="button button-outline" onClick={onBack}>Return to patient site</button>
  </section>;
}

function ClipboardListFallback() {
  return <span aria-hidden="true" style={{display:"inline-block",fontSize:25}}>▤</span>;
}
