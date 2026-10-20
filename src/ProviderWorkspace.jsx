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
  const [tab,setTab] = useState("home");
  const [profile,setProfile] = useState(()=>{try{return JSON.parse(window.localStorage.getItem("healthreachcare-provider-profile-"+role)||"{}")}catch{return {}}});
  const [schedule,setSchedule] = useState(()=>{try{return JSON.parse(window.localStorage.getItem("healthreachcare-provider-schedule-"+role)||"{}")}catch{return {}}});
  const [messageDrafts, setMessageDrafts] = useState({});
  const [messageErrors, setMessageErrors] = useState({});

  const kind = role === "doctor" ? "appointment" : "homecare";
  const providerPrefix = role === "doctor" ? "demo-doctor-provider" : "demo-homecare-provider";
  const allRequests = workflow.bookings.filter(item => item.testOnly === true && item.kind === kind && String(item.providerId || "").startsWith(providerPrefix));
  const visible = allRequests.filter(item => tab === "appointments" ? ["confirmed","completed"].includes(item.status) : filter === "all" || (filter === "pending" ? item.status === "awaiting_provider_review" : item.status === filter));
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
    <div className="staff-tab-row" role="tablist" aria-label="Provider workspace sections">{[["home","Home"],["requests",role==="homecare"?"Requests":"Patient requests"],["appointments",role==="homecare"?"Visits":"Appointments"],["finance","Finance"],["schedule","Schedule"],["profile","Profile & verification"]].map(([id,label])=><button type="button" role="tab" aria-selected={tab===id} className={tab===id?"active":""} key={id} onClick={()=>setTab(id)}>{label}</button>)}</div>
    {tab==="home"&&(role==="homecare"?<div className="homecare-dashboard">
      <div className="homecare-welcome"><div><span className="eyebrow">HOMECARE OPERATIONS</span><h2>Welcome back{profile.name ? ", "+profile.name : ", care team"}</h2><p>Review care requests, coordinate upcoming visits, and keep each patient informed.</p></div><div className="homecare-verification"><ShieldCheck size={18}/><span><strong>Provider profile</strong><small>Preview · verification not connected</small></span></div></div>
      <div className="homecare-metrics">
        <button type="button" className="homecare-metric" onClick={()=>{setFilter("pending");setTab("requests");}}><span className="homecare-metric-icon"><Clock3/></span><strong>{pendingCount}</strong><small>New requests</small><span className="homecare-metric-link">Review requests →</span></button>
        <button type="button" className="homecare-metric" onClick={()=>{setFilter("accepted");setTab("requests");}}><span className="homecare-metric-icon"><Wallet/></span><strong>{acceptedUnpaid}</strong><small>Awaiting patient checkout</small><span className="homecare-metric-link">View accepted →</span></button>
        <button type="button" className="homecare-metric" onClick={()=>setTab("appointments")}><span className="homecare-metric-icon"><CalendarDays/></span><strong>{allRequests.filter(r=>r.status==="confirmed").length}</strong><small>Confirmed visits</small><span className="homecare-metric-link">Open visits →</span></button>
        <button type="button" className="homecare-metric" onClick={()=>setTab("appointments")}><span className="homecare-metric-icon"><CheckCircle2/></span><strong>{allRequests.filter(r=>r.status==="completed").length}</strong><small>Completed services</small><span className="homecare-metric-link">View history →</span></button>
      </div>
      {pendingCount>0&&<div className="homecare-action-banner"><span className="homecare-action-icon"><AlertCircle/></span><div><strong>{pendingCount} request{pendingCount===1?"":"s"} need your attention</strong><p>Check the service, requested time, location and care notes before accepting or declining.</p></div><button type="button" className="button button-primary" onClick={()=>{setFilter("pending");setTab("requests");}}>Review now</button></div>}
      <div className="homecare-home-columns">
        <article className="homecare-panel"><div className="homecare-panel-heading"><div><span className="eyebrow">UPCOMING CARE</span><h3>Confirmed visits</h3></div><button type="button" className="text-button" onClick={()=>setTab("appointments")}>View all →</button></div>
          {allRequests.filter(r=>r.status==="confirmed").sort((a,b)=>String(a.requestedDate||"").localeCompare(String(b.requestedDate||""))||String(a.requestedTime||"").localeCompare(String(b.requestedTime||""))).slice(0,3).length ? allRequests.filter(r=>r.status==="confirmed").sort((a,b)=>String(a.requestedDate||"").localeCompare(String(b.requestedDate||""))||String(a.requestedTime||"").localeCompare(String(b.requestedTime||""))).slice(0,3).map(item=><div className="homecare-visit-row" key={item.id}><span className="homecare-visit-icon"><House size={18}/></span><div className="homecare-visit-copy"><strong>{item.serviceType||item.service||"Homecare visit"}</strong><span>{item.patientName||"Patient"} · {item.location||"Location not supplied"}</span><small>{item.requestedDate||"Date not specified"}{item.requestedTime?" · "+item.requestedTime:""} · {item.duration||"Duration not specified"} hour(s)</small></div><span className="request-status status-confirmed">Confirmed</span></div>) : <div className="homecare-empty"><CalendarDays size={23}/><strong>No confirmed visits yet</strong><p>When a patient completes the simulated checkout, the confirmed visit will appear here.</p><button type="button" className="text-button" onClick={()=>{setFilter("pending");setTab("requests");}}>Check new requests →</button></div>}
        </article>
        <article className="homecare-panel"><div className="homecare-panel-heading"><div><span className="eyebrow">QUICK ACTIONS</span><h3>Manage your workspace</h3></div></div>
          <button type="button" className="homecare-quick-action" onClick={()=>{setFilter("pending");setTab("requests");}}><span><Clock3 size={18}/></span><div><strong>Review new requests</strong><small>Accept or decline patient bookings</small></div><span>→</span></button>
          <button type="button" className="homecare-quick-action" onClick={()=>setTab("schedule")}><span><CalendarDays size={18}/></span><div><strong>Update availability</strong><small>Set working days, hours and capacity</small></div><span>→</span></button>
          <button type="button" className="homecare-quick-action" onClick={()=>setTab("profile")}><span><ShieldCheck size={18}/></span><div><strong>Provider profile</strong><small>Maintain contact and profile details</small></div><span>→</span></button>
          <button type="button" className="homecare-quick-action" onClick={()=>setTab("finance")}><span><Wallet size={18}/></span><div><strong>Finance overview</strong><small>Review recorded sandbox transactions</small></div><span>→</span></button>
        </article>
      </div>
      <div className="homecare-footnote"><ShieldCheck size={16}/><span>Sandbox workflow only. Requests and updates sync through this browser's local test data; provider approval, real notifications, payments and cross-device storage are not connected.</span></div>
    </div>:<div className="provider-home-grid"><article className="test-surface"><h2>Next actions</h2><p><strong>{pendingCount}</strong> patient request(s) need review. Review the requested service and time before accepting.</p><button className="button button-primary" onClick={()=>{setFilter("pending");setTab("requests");}}>Review pending requests</button></article><article className="test-surface"><h2>Today's care snapshot</h2><p>Confirmed visits: <strong>{allRequests.filter(r=>r.status==="confirmed").length}</strong></p><p>Completed services: <strong>{allRequests.filter(r=>r.status==="completed").length}</strong></p><p>Accepted awaiting checkout: <strong>{acceptedUnpaid}</strong></p><small className="muted">Local test records only; no real visit is scheduled.</small></article></div>)}
    {tab==="finance"&&<div className="test-surface"><h2>Finance overview</h2><p className="muted small">Completed authorised test service value only. No settlement or payout is processed.</p><div className="test-metric-grid"><div className="provider-stat"><strong>{money(allRequests.filter(r=>r.status==="completed"&&r.paymentStatus==="test_authorized").reduce((sum,r)=>sum+Number(r.servicePrice??r.consultationFee??0),0))}</strong><small>Completed test value</small></div><div className="provider-stat"><strong>{allRequests.filter(r=>r.paymentStatus==="test_authorized").length}</strong><small>Authorised test bookings</small></div><div className="provider-stat"><strong>{allRequests.filter(r=>r.paymentStatus==="test_refunded").length}</strong><small>Refund records</small></div></div>{allRequests.filter(r=>r.paymentId||r.refundId).map(r=><article className="admin-record-card" key={r.id}><div><strong>{r.id}</strong><span>{r.patientName} · {r.serviceType||r.service}</span><small>{r.paymentId||"No payment"} · {readable(r.paymentStatus)}</small></div><strong>{money(r.servicePrice??r.consultationFee)}</strong></article>)}</div>}
    {tab==="schedule"&&<div className="test-surface"><h2>Availability & schedule</h2><p className="muted small">Saved locally as preview preferences. Does not reserve slots or prevent real-world double booking.</p><form className="pharmacy-settings-form" onSubmit={e=>{e.preventDefault();try{window.localStorage.setItem("healthreachcare-provider-schedule-"+role,JSON.stringify(schedule));setNotice("Schedule preferences saved locally; live availability is not published.");}catch{setError("Could not save schedule preferences.");}}}><label>Working days<select value={schedule.days||"weekdays"} onChange={e=>setSchedule(v=>({...v,days:e.target.value}))}><option value="weekdays">Monday–Friday</option><option value="all">Every day</option><option value="weekends">Weekends</option><option value="custom">Custom / by request</option></select></label><label>Start time<input type="time" value={schedule.start||"09:00"} onChange={e=>setSchedule(v=>({...v,start:e.target.value}))}/></label><label>End time<input type="time" value={schedule.end||"17:00"} onChange={e=>setSchedule(v=>({...v,end:e.target.value}))}/></label><label>Daily capacity<input type="number" min="1" max="100" value={schedule.capacity||8} onChange={e=>setSchedule(v=>({...v,capacity:e.target.value}))}/></label><button className="button button-primary">Save schedule preferences</button></form></div>}
    {tab==="profile"&&<div className="test-surface"><h2>Profile & verification</h2><p>Profile details are preview-only. Verification remains unconnected until real identity, credential and role approval services are configured.</p><form className="pharmacy-settings-form" onSubmit={e=>{e.preventDefault();try{window.localStorage.setItem("healthreachcare-provider-profile-"+role,JSON.stringify(profile));setNotice("Provider profile saved locally. Verification status remains unverified.");}catch{setError("Could not save provider profile.");}}}><label>Display name<input required maxLength="120" value={profile.name||""} onChange={e=>setProfile(v=>({...v,name:e.target.value}))} placeholder="Test provider name"/></label><label>Contact email<input type="email" maxLength="160" value={profile.email||""} onChange={e=>setProfile(v=>({...v,email:e.target.value}))} placeholder="provider@example.test"/></label><label>Contact phone<input type="tel" maxLength="40" value={profile.phone||""} onChange={e=>setProfile(v=>({...v,phone:e.target.value}))} placeholder="Test contact number"/></label><div className="inline-message"><ShieldCheck size={17}/><span>Verification: not connected. This preview does not certify a real clinician or homecare provider.</span></div><button className="button button-primary">Save profile</button></form></div>}
    {notice && <div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span><button type="button" aria-label="Dismiss notice" onClick={()=>setNotice("")}>×</button></div>}
    {error && <div className="state-card state-error"><AlertCircle/><div><strong>Could not update</strong><p>{error}</p></div></div>}
    {["requests","appointments"].includes(tab) && <>
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
    </>}
    <button className="button button-outline" onClick={onBack}>Return to patient site</button>
  </section>;
}
