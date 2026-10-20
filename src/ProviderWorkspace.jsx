import { useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, CreditCard, House, ShieldCheck, Stethoscope, XCircle, CalendarDays, RefreshCw, Wallet, MessageCircle, Send } from "lucide-react";
import { sendTestMessage, transitionTestBooking, useTestWorkflow } from "./test-workflow.js";

const readable = value => String(value || "").replace(/[_-]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
const formatDate = value => value ? new Date(value).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "Not specified";
const money = value => "R" + Number(value || 0).toFixed(2);

export default function ProviderWorkspace({ role = "doctor", onBack }) {
  const workflow = useTestWorkflow();
  const [filter, setFilter] = useState("pending");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [messageDrafts, setMessageDrafts] = useState({});
  const [messageErrors, setMessageErrors] = useState({});

  const kind = role === "doctor" ? "appointment" : "homecare";
  const providerPrefix = role === "doctor" ? "demo-doctor-provider" : "demo-homecare-provider";
  const allRequests = workflow.bookings.filter(item => item.testOnly === true && item.kind === kind && String(item.providerId || "").startsWith(providerPrefix));
  const visible = allRequests.filter(item => filter === "all" || (filter === "pending" ? item.status === "awaiting_provider_review" : item.status === filter));
  const pendingCount = allRequests.filter(item => item.status === "awaiting_provider_review").length;
  const acceptedUnpaid = allRequests.filter(item => item.status === "accepted" && item.paymentStatus !== "test_authorized").length;

  const updateRequest = (item, status) => {
    setBusyId(item.id); setNotice(""); setError("");
    const result = transitionTestBooking(item.id, status);
    setBusyId("");
    if (result?.error) setError(result.error);
    else setNotice(status === "accepted"
      ? "Request accepted. The patient can now complete the simulated checkout from Activities."
      : status === "completed"
        ? "Service marked completed in the local workflow. The patient can now leave a review."
        : "Request declined. The patient activity and status history have been updated in this browser.");
  };

  const sendProviderMessage = (item) => {
    const body = String(messageDrafts[item.id] || "").trim();
    const result = sendTestMessage({ requestId: item.id, requestType: "booking", senderRole: role, senderName: item.providerName || (role === "doctor" ? "Doctor workspace" : "Homecare coordination"), body });
    if (result?.error) { setMessageErrors(current=>({...current,[item.id]:result.error})); return; }
    setMessageDrafts(current=>({...current,[item.id]:""}));
    setMessageErrors(current=>({...current,[item.id]:""}));
    setNotice("Message saved to this request's local conversation. It has not been sent as SMS or email.");
    workflow.refresh();
  };

  return <section className="page-content provider-workspace">
    <div className="eyebrow">PROVIDER WORKSPACE · SANDBOX</div>
    <h1>{role === "doctor" ? "Doctor workspace" : "Homecare coordination workspace"}</h1>
    <p className="lead">{role === "doctor" ? "Review appointment requests, accept a preferred time, and follow the simulated payment and confirmation lifecycle." : "Review homecare requests, confirm the service and visit duration, and follow the simulated payment and confirmation lifecycle."}</p>
    <div className="booking-test-banner"><ShieldCheck size={18}/><span><strong>Connected sandbox workflow:</strong> patient requests, provider decisions, payment records and status history use one shared local workflow. No real patient data, messages, money or provider notifications are used.</span></div>
    <div className="provider-summary">
      <div className="provider-stat"><span>{role === "doctor" ? <Stethoscope/> : <House/>}</span><strong>{allRequests.length}</strong><small>Total requests</small></div>
      <div className="provider-stat"><span><Clock3/></span><strong>{pendingCount}</strong><small>Awaiting review</small></div>
      <div className="provider-stat"><span><CreditCard/></span><strong>{acceptedUnpaid}</strong><small>Accepted · awaiting checkout</small></div>
      <div className="provider-stat"><span><CalendarDays/></span><strong>{allRequests.filter(r=>r.status==="confirmed").length}</strong><small>Confirmed after payment</small></div>
    </div>
    {notice && <div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span><button type="button" aria-label="Dismiss notice" onClick={()=>setNotice("")}>×</button></div>}
    {error && <div className="state-card state-error"><AlertCircle/><div><strong>Could not update</strong><p>{error}</p></div></div>}
    <div className="provider-toolbar"><h2>Incoming requests</h2><div className="provider-toolbar-actions"><select aria-label="Filter requests" value={filter} onChange={e => setFilter(e.target.value)}><option value="pending">Awaiting review</option><option value="accepted">Accepted · awaiting payment</option><option value="confirmed">Confirmed</option><option value="declined">Declined</option><option value="all">All requests</option></select><button className="button button-outline" type="button" onClick={workflow.refresh}><RefreshCw size={15}/> Refresh</button></div></div>
    {visible.length ? <div className="provider-request-list">{visible.map(item => {
      const pending = item.status === "awaiting_provider_review";
      const amount = Number(item.servicePrice ?? item.consultationFee ?? 0);
      return <article className="provider-request-card" key={item.id}>
        <div className="provider-request-head"><div><span className="provider-request-type">{role === "doctor" ? "DOCTOR APPOINTMENT" : "HOMECARE REQUEST"}</span><h3>{item.patientName || "Patient"}</h3><p>{item.patientPhone || "No phone supplied"} · {item.location || "Location not supplied"}</p></div><span className={"request-status status-" + item.status}>{readable(item.status)}</span></div>
        <div className="provider-request-details">
          {role === "doctor" ? <p><strong>Consultation:</strong> {item.serviceType || "Not specified"} · {item.consultationMode || "Format not selected"}</p> : <p><strong>Service:</strong> {item.serviceType || "Not specified"} · {item.duration || "Duration not specified"} hour(s)</p>}
          <p><strong>Requested:</strong> {item.requestedDate || "Date not specified"} {item.requestedTime || ""}</p>
          <p><strong>Submitted:</strong> {formatDate(item.createdAt)}</p>
          {item.details && <p><strong>Additional notes:</strong> {item.details}</p>}
          {item.healthConcern && <p><strong>Patient's consultation note:</strong> {item.healthConcern}</p>}
          <p><strong>Quoted service amount:</strong> {amount > 0 ? money(amount) : "No quote available"}</p>
          <p><strong>Payment:</strong> {item.paymentStatus === "test_authorized" ? "Sandbox authorised — no funds moved" : item.status === "accepted" ? "Awaiting patient checkout" : item.status === "confirmed" ? "Sandbox authorised" : "Not due until accepted"}</p>
          {item.paymentId && <p><strong>Payment reference:</strong> {item.paymentId}</p>}
        </div>
        {pending && <div className="provider-request-actions"><button className="button button-primary" disabled={Boolean(busyId)} onClick={() => updateRequest(item, "accepted")}>{busyId === item.id ? "Saving…" : <><CheckCircle2 size={16}/> Accept request</>}</button><button className="button button-outline" disabled={Boolean(busyId)} onClick={() => updateRequest(item, "declined")}><XCircle size={16}/> Decline</button></div>}
        {item.status === "accepted" && <div className="inline-message"><Wallet size={17}/><span>Accepted. The patient can now pay using the simulated checkout in Activities. Confirmation occurs only after the simulated payment is recorded.</span></div>}
        {item.status === "confirmed" && <div className="inline-message"><CheckCircle2 size={17}/><span>Confirmed in sandbox after simulated payment authorisation. No real money moved and no real visit was booked.</span></div>}{item.status === "confirmed" && <div className="provider-request-actions"><button className="button button-primary" disabled={Boolean(busyId)} onClick={() => updateRequest(item, "completed")}><CheckCircle2 size={16}/> Mark service completed</button></div>}{item.status === "completed" && <div className="inline-message"><CheckCircle2 size={17}/><span>Service completed in the sandbox. Patient review is now enabled in Activities.</span></div>}
        {item.status === "declined" && <div className="inline-message"><AlertCircle size={17}/><span>This request was declined in the sandbox. A production version should capture a reason and notify the patient.</span></div>}
        {Array.isArray(item.statusHistory) && item.statusHistory.length > 0 && <details className="provider-status-history"><summary>Request history ({item.statusHistory.length})</summary>{item.statusHistory.map((event,index)=><p key={event.at + "-" + index}><strong>{readable(event.status)}</strong><span>{formatDate(event.at)}</span></p>)}</details>}
        {!["declined","cancelled"].includes(item.status) && <div className="provider-message-thread"><div className="provider-message-title"><MessageCircle size={17}/><strong>Patient conversation</strong><span>{workflow.messages.filter(message=>message.requestId===item.id&&message.requestType==="booking").length} messages</span></div><div className="provider-message-list">{workflow.messages.filter(message=>message.requestId===item.id&&message.requestType==="booking").length ? workflow.messages.filter(message=>message.requestId===item.id&&message.requestType==="booking").map(message=><article key={message.id} className={"provider-message-bubble"+(message.senderRole===role?" provider-message-own":"")}><div><strong>{message.senderName}</strong><small>{formatDate(message.createdAt)}</small></div><p>{message.body}</p></article>):<p className="provider-message-empty">No messages yet. Use this thread for scheduling and service coordination.</p>}</div><label>Reply to patient<textarea rows={2} maxLength={2000} value={messageDrafts[item.id]||""} onChange={event=>{setMessageDrafts(current=>({...current,[item.id]:event.target.value}));setMessageErrors(current=>({...current,[item.id]:""}));}} placeholder="Write a request-specific reply. Avoid unnecessary sensitive details."/></label>{messageErrors[item.id]&&<p className="provider-message-error">{messageErrors[item.id]}</p>}<button type="button" className="button button-outline" onClick={()=>sendProviderMessage(item)}><Send size={15}/> Send reply</button><small>Local test conversation only. No SMS, email or push notification is sent.</small></div>}
      </article>;
    })}</div> : <div className="empty-state"><span aria-hidden="true" style={{display:"inline-block",fontSize:25}}>▤</span><h3>No {filter === "pending" ? "pending " : ""}requests</h3><p>Submit a doctor appointment or homecare request from the patient experience. It will appear here in the same browser and can be actioned through this workflow.</p></div>}
    <button className="button button-outline" onClick={onBack}>Return to patient site</button>
  </section>;
}
