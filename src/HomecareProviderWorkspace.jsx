import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, CheckCircle2, ChevronRight, Clock3, CreditCard, House, MessageCircle, Plus, Save, ShieldCheck, UserRound, Wallet, XCircle } from "lucide-react";
import "./HomecareProviderWorkspace.css";

const REQUESTS_KEY = "healthreachcare-test-bookings";
const TEAM_KEY = "healthreachcare-homecare-team-v1";
const SETTINGS_KEY = "healthreachcare-homecare-settings-v1";
const readJson = (key, fallback) => { try { const value = JSON.parse(localStorage.getItem(key) || "null"); return value ?? fallback; } catch { return fallback; } };
const writeJson = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); window.dispatchEvent(new CustomEvent("healthreachcare-test-bookings-updated")); };
const text = value => String(value || "").trim();
const safeDate = value => { if (!value) return "Date unavailable"; const d = new Date(value); return Number.isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100 ? "Date unavailable" : d.toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }); };
const defaultSettings = { hourlyRates: { personal_care: "", elderly_care: "", post_surgery: "", mobility: "", medication_support: "", specialised_care: "" }, providerName: "", serviceArea: "", workingHours: "08:00–18:00", approvalStatus: "pending" };
const serviceNames = { personal_care: "Personal care", elderly_care: "Elderly care", post_surgery: "Post-surgery care", mobility: "Mobility assistance", medication_support: "Medication support", specialised_care: "Specialised care" };
const blankMember = { id: "", fullName: "", role: "Caregiver", qualifications: "", experience: "", photoUrl: "", availability: "Available" };

export default function HomecareProviderWorkspace() {
  const [section, setSection] = useState("home");
  const [requests, setRequests] = useState(() => readJson(REQUESTS_KEY, []));
  const [team, setTeam] = useState(() => readJson(TEAM_KEY, []));
  const [settings, setSettings] = useState(() => ({ ...defaultSettings, ...readJson(SETTINGS_KEY, {}) }));
  const [filter, setFilter] = useState("new");
  const [selectedId, setSelectedId] = useState("");
  const [member, setMember] = useState(blankMember);
  const [editingMemberId, setEditingMemberId] = useState("");
  const [chatText, setChatText] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const refresh = () => {
      setRequests(readJson(REQUESTS_KEY, []));
      setTeam(readJson(TEAM_KEY, []));
      setSettings({ ...defaultSettings, ...readJson(SETTINGS_KEY, {}) });
    };
    window.addEventListener("storage", refresh);
    window.addEventListener("healthreachcare-test-bookings-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("healthreachcare-test-bookings-updated", refresh);
    };
  }, []);

  const homecareRequests = requests.filter(item => item.kind === "homecare");
  const selected = homecareRequests.find(item => item.id === selectedId) || null;
  const pending = homecareRequests.filter(item => ["pending", "requested", "awaiting_provider_review"].includes(String(item.status || item.requestStatus || "").toLowerCase()));
  const accepted = homecareRequests.filter(item => ["accepted", "assigned", "scheduled", "in_progress"].includes(String(item.status || "").toLowerCase()));
  const completed = homecareRequests.filter(item => ["completed", "cancelled", "declined", "rejected"].includes(String(item.status || "").toLowerCase()));
  const visible = useMemo(() => homecareRequests.filter(item => {
    const status = String(item.status || item.requestStatus || "pending").toLowerCase();
    const matchesFilter = filter === "all" || (filter === "new" ? ["pending", "requested", "awaiting_provider_review"].includes(status) : filter === "accepted" ? ["accepted", "assigned", "scheduled", "in_progress"].includes(status) : filter === "completed" ? ["completed"].includes(status) : filter === "declined" ? ["declined", "rejected", "cancelled"].includes(status) : true);
    const needle = query.trim().toLowerCase();
    return matchesFilter && (!needle || [item.id, item.patientName, item.serviceType, item.location].some(v => String(v || "").toLowerCase().includes(needle)));
  }), [homecareRequests, filter, query]);

  const persistRequests = next => {
    setRequests(next);
    writeJson(REQUESTS_KEY, next);
  };
  const saveSettings = event => {
    event.preventDefault();
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      setNotice("Homecare service settings saved in this browser only.");
      setError("");
    } catch { setError("Could not save settings in this browser."); }
  };
  const saveMember = event => {
    event.preventDefault();
    if (!text(member.fullName) || !text(member.qualifications) || !text(member.experience)) {
      setError("Enter the caregiver's full name, qualifications and experience.");
      return;
    }
    const nextMember = { ...member, id: editingMemberId || "caregiver-" + Date.now().toString(36), fullName: text(member.fullName), qualifications: text(member.qualifications), experience: text(member.experience), photoUrl: text(member.photoUrl) };
    const next = editingMemberId ? team.map(item => item.id === editingMemberId ? nextMember : item) : [...team, nextMember];
    try {
      localStorage.setItem(TEAM_KEY, JSON.stringify(next));
      setTeam(next);
      setMember(blankMember);
      setEditingMemberId("");
      setNotice("Care team profile saved in this browser only.");
      setError("");
    } catch { setError("Could not save the care team profile."); }
  };
  const changeStatus = (item, status) => {
    const current = readJson(REQUESTS_KEY, []);
    const index = current.findIndex(row => row.id === item.id && row.kind === "homecare");
    if (index < 0) { setError("This booking could not be found. Refresh and try again."); return; }
    const currentStatus = String(current[index].status || current[index].requestStatus || "").toLowerCase();
    if (status === "accepted" && !["pending", "requested", "awaiting_provider_review"].includes(currentStatus)) {
      setError("This request has already been actioned."); return;
    }
    if (status === "accepted" && !["test_paid", "paid", "test_authorized"].includes(String(current[index].paymentStatus || "").toLowerCase())) {
      setError("This booking has not completed its test payment step. Do not accept unpaid requests."); return;
    }
    current[index] = { ...current[index], status, requestStatus: status, providerResponseAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    persistRequests(current);
    setNotice(status === "accepted" ? "Booking accepted. Assign an available caregiver and confirm the schedule next." : "Booking declined. The test request status has been updated.");
    setError("");
  };
  const assignMember = (item, caregiverId) => {
    const caregiver = team.find(person => person.id === caregiverId);
    if (!caregiver) { setError("Choose a caregiver profile before assigning this booking."); return; }
    const current = readJson(REQUESTS_KEY, []);
    const index = current.findIndex(row => row.id === item.id && row.kind === "homecare");
    if (index < 0) { setError("Booking not found."); return; }
    if (!["accepted", "assigned", "scheduled"].includes(String(current[index].status || "").toLowerCase())) { setError("Accept the paid booking before assigning a caregiver."); return; }
    current[index] = { ...current[index], assignedCaregiver: { id: caregiver.id, fullName: caregiver.fullName, role: caregiver.role, qualifications: caregiver.qualifications, experience: caregiver.experience, photoUrl: caregiver.photoUrl }, assignedAt: new Date().toISOString(), status: "assigned", requestStatus: "assigned", updatedAt: new Date().toISOString() };
    persistRequests(current);
    setSelectedId(item.id);
    setNotice(caregiver.fullName + " assigned to this booking. The patient can see the saved assignment in Activities in this browser preview.");
    setError("");
  };
  const sendMessage = event => {
    event.preventDefault();
    if (!selected || !text(chatText)) return;
    const current = readJson(REQUESTS_KEY, []);
    const index = current.findIndex(row => row.id === selected.id);
    if (index < 0) return;
    const messages = Array.isArray(current[index].messages) ? current[index].messages : [];
    current[index] = { ...current[index], messages: [...messages, { id: "msg-" + Date.now(), sender: "provider", text: text(chatText), createdAt: new Date().toISOString() }], updatedAt: new Date().toISOString() };
    persistRequests(current);
    setChatText("");
    setNotice("Message saved in this browser preview. It has not been sent over the internet.");
    setError("");
  };
  const totalTestPaid = homecareRequests.filter(item => ["test_paid", "test_authorized", "paid"].includes(String(item.paymentStatus || "").toLowerCase())).reduce((sum, item) => sum + Number(item.paidAmount || 0), 0);
  const feesConfigured = Object.values(settings.hourlyRates || {}).some(value => Number(value) > 0);

  return <section className="page-content hc-workspace">
    <header className="hc-header">
      <div className="hc-brand"><span className="hc-logo"><House size={22}/></span><div><strong>HealthReachCare</strong><span>Homecare provider</span></div></div>
      <div className="hc-header-meta"><span className="hc-mode"><ShieldCheck size={14}/> LOCAL TEST MODE</span><span className="hc-approval">Provider approval: {settings.approvalStatus || "pending"}</span></div>
    </header>
    <div className="hc-welcome"><div><p className="hc-kicker">PROVIDER WORKSPACE</p><h1>{settings.providerName ? "Welcome, " + settings.providerName : "Homecare dashboard"}</h1><p>Manage paid requests, coordinate your care team, schedule visits and keep booking conversations together.</p></div><div className="hc-availability"><span className="hc-live-dot"/> Workspace ready <small>Browser preview only</small></div></div>
    <nav className="hc-nav" aria-label="Homecare provider navigation">
      {[["home","Home",House],["bookings","Bookings",CalendarDays],["finances","Finances",Wallet],["account","Account",UserRound]].map(([id,label,Icon])=><button key={id} type="button" className={section===id?"active":""} onClick={()=>{setSection(id);setNotice("");setError("");}}><Icon size={18}/>{label}{id==="bookings"&&pending.length>0&&<span className="hc-nav-count">{pending.length}</span>}</button>)}
    </nav>
    {notice && <div className="hc-notice"><CheckCircle2 size={18}/><span>{notice}</span><button onClick={()=>setNotice("")} aria-label="Dismiss message">×</button></div>}
    {error && <div className="hc-error"><XCircle size={18}/><span>{error}</span></div>}
    {section === "home" && <>
      <div className="hc-stats">
        <button onClick={()=>{setSection("bookings");setFilter("new");}}><span><CalendarDays/></span><strong>{pending.length}</strong><small>New paid requests</small></button>
        <button onClick={()=>{setSection("bookings");setFilter("accepted");}}><span><Clock3/></span><strong>{accepted.length}</strong><small>Accepted / assigned</small></button>
        <button onClick={()=>setSection("account")}><span><UserRound/></span><strong>{team.length}</strong><small>Care team members</small></button>
        <button onClick={()=>setSection("finances")}><span><CreditCard/></span><strong>R{totalTestPaid.toFixed(2)}</strong><small>Test-payment total (not real funds)</small></button>
      </div>
      <div className="hc-two-col">
        <section className="hc-card"><div className="hc-card-head"><div><h2>Incoming paid requests</h2><p>Review the request, then accept or decline it.</p></div><button className="hc-link" onClick={()=>setSection("bookings")}>All bookings <ChevronRight size={16}/></button></div>
          {pending.slice(0,3).map(item=><button className="hc-request-row" key={item.id} onClick={()=>{setSelectedId(item.id);setSection("bookings");}}><span className="hc-request-icon"><House size={18}/></span><span><strong>{item.serviceType || "Homecare service"}</strong><small>{item.patientName || "Patient"} · {safeDate(item.requestedDate ? item.requestedDate+"T"+(item.requestedTime||"00:00") : "")}</small></span><span className="hc-amount">R{Number(item.paidAmount||0).toFixed(2)}</span></button>)}
          {!pending.length&&<div className="hc-empty"><CalendarDays size={25}/><strong>No new paid requests</strong><p>Paid homecare requests will appear here when submitted in the same browser preview.</p></div>}
        </section>
        <section className="hc-card"><div className="hc-card-head"><div><h2>Upcoming schedule</h2><p>Accepted bookings with a caregiver assignment.</p></div></div>
          {homecareRequests.filter(item=>["assigned","scheduled","in_progress"].includes(String(item.status||"").toLowerCase())).slice(0,4).map(item=><div className="hc-schedule-row" key={item.id}><span className="hc-date-chip">{item.requestedDate||"TBD"}</span><div><strong>{item.assignedCaregiver?.fullName||"Caregiver to assign"}</strong><small>{item.serviceType} · {item.requestedTime||"Time TBD"}</small></div><span className="hc-status">{item.status}</span></div>)}
          {!homecareRequests.some(item=>["assigned","scheduled","in_progress"].includes(String(item.status||"").toLowerCase()))&&<div className="hc-empty"><Clock3 size={25}/><strong>No scheduled visits yet</strong><p>Accept a paid booking and assign a team member to build the schedule.</p></div>}
        </section>
      </div>
    </>}
    {section === "bookings" && <section className="hc-card hc-bookings"><div className="hc-card-head"><div><h2>Bookings</h2><p>Review payments, accept requests, assign a caregiver and coordinate messages.</p></div></div>
      <div className="hc-toolbar"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search name, service or reference" aria-label="Search bookings"/><div className="hc-filters">{[["new","New"],["accepted","Accepted"],["completed","Completed"],["declined","Declined"],["all","All"]].map(([id,label])=><button key={id} className={filter===id?"active":""} onClick={()=>setFilter(id)}>{label}</button>)}</div></div>
      <div className="hc-booking-layout"><div className="hc-booking-list">{visible.map(item=><button key={item.id} className={"hc-booking-item"+(selectedId===item.id?" selected":"")} onClick={()=>setSelectedId(item.id)}><span><strong>{item.serviceType||"Homecare request"}</strong><small>{item.patientName||"Patient"} · {item.requestedDate||"Date unavailable"} {item.requestedTime||""}</small><small>{item.id}</small></span><span className={"hc-pill hc-"+String(item.status||"pending").toLowerCase()}>{String(item.status||"pending").replace(/_/g," ")}</span></button>)}{!visible.length&&<div className="hc-empty"><CalendarDays size={25}/><strong>No bookings in this filter</strong><p>Try another filter or search term.</p></div>}</div>
      <div className="hc-booking-detail">{selected ? <>
        <div className="hc-detail-head"><div><span className="hc-kicker">BOOKING DETAILS</span><h3>{selected.serviceType||"Homecare service"}</h3><p>Reference: {selected.id}</p></div><span className={"hc-pill hc-"+String(selected.status||"pending").toLowerCase()}>{String(selected.status||"pending").replace(/_/g," ")}</span></div>
        <div className="hc-detail-grid"><div><small>Patient</small><strong>{selected.patientName||"Name unavailable"}</strong></div><div><small>Phone</small><strong>{selected.patientPhone||"Not provided"}</strong></div><div><small>Requested date</small><strong>{safeDate(selected.requestedDate ? selected.requestedDate+"T"+(selected.requestedTime||"00:00") : "")}</strong></div><div><small>Duration</small><strong>{selected.duration||"Not specified"}</strong></div><div className="wide"><small>Service address</small><strong>{selected.location||"Not provided"}</strong></div><div className="wide"><small>Additional details</small><strong>{selected.details||"No additional details"}</strong></div></div>
        <div className="hc-payment-row"><span><CreditCard size={17}/> Payment status</span><strong>{selected.paymentStatus||"not started"} · {selected.paidAmount ? "R"+Number(selected.paidAmount).toFixed(2) : "No amount recorded"}</strong></div>
        {["pending","requested","awaiting_provider_review"].includes(String(selected.status||selected.requestStatus||"").toLowerCase())&&<div className="hc-action-row"><button className="hc-primary" onClick={()=>changeStatus(selected,"accepted")}><CheckCircle2 size={16}/> Accept booking</button><button className="hc-secondary" onClick={()=>changeStatus(selected,"declined")}><XCircle size={16}/> Decline</button></div>}
        {["accepted","assigned","scheduled"].includes(String(selected.status||"").toLowerCase())&&<div className="hc-assign"><h4>Assign a caregiver</h4><p>Choose a team member. Their name, picture, qualifications and experience are saved with the booking.</p><select value={selected.assignedCaregiver?.id||""} onChange={e=>assignMember(selected,e.target.value)}><option value="">Select approved team member</option>{team.filter(person=>person.availability!=="Unavailable").map(person=><option key={person.id} value={person.id}>{person.fullName} · {person.role}</option>)}</select>{selected.assignedCaregiver&&<div className="hc-caregiver-card">{selected.assignedCaregiver.photoUrl?<img src={selected.assignedCaregiver.photoUrl} alt={selected.assignedCaregiver.fullName}/>:<span className="hc-avatar"><UserRound size={24}/></span>}<div><strong>{selected.assignedCaregiver.fullName}</strong><p>{selected.assignedCaregiver.role}</p><small>{selected.assignedCaregiver.qualifications} · {selected.assignedCaregiver.experience}</small></div></div>}</div>}
        <div className="hc-chat"><h4><MessageCircle size={17}/> Booking conversation</h4><p>Use this thread to coordinate with the patient in the same browser preview.</p><div className="hc-messages">{(selected.messages||[]).map(message=><div key={message.id} className={"hc-message "+(message.sender==="provider"?"outgoing":"incoming")}><span>{message.sender==="provider"?"Provider":"Patient"}</span><p>{message.text}</p><small>{safeDate(message.createdAt)}</small></div>)}{!(selected.messages||[]).length&&<span className="hc-muted">No messages yet.</span>}</div><form onSubmit={sendMessage}><input value={chatText} onChange={e=>setChatText(e.target.value)} maxLength={1000} placeholder="Write a booking message…" aria-label="Booking message"/><button className="hc-primary" type="submit" disabled={!text(chatText)}>Send</button></form></div>
      </> : <div className="hc-empty"><CalendarDays size={25}/><strong>Select a booking</strong><p>Choose a booking to review its details and take action.</p></div>}</div></div>
    </section>}
    {section === "finances" && <section className="hc-card"><div className="hc-card-head"><div><h2>Finances</h2><p>Transparent test records. This preview does not move money or issue payouts.</p></div></div><div className="hc-finance-stats"><div><small>Test payments recorded</small><strong>R{totalTestPaid.toFixed(2)}</strong></div><div><small>Completed services</small><strong>{homecareRequests.filter(item=>item.status==="completed").length}</strong></div><div><small>Provider payout</small><strong>Not connected</strong></div></div><div className="hc-inline-note"><ShieldCheck size={17}/> Patient test payments are simulated only. Do not treat these totals as revenue or funds received.</div><h3>Transactions</h3>{homecareRequests.filter(item=>item.paidAmount).map(item=><div className="hc-transaction" key={item.id}><div><strong>{item.serviceType}</strong><small>{item.id} · {item.paymentStatus}</small></div><strong>R{Number(item.paidAmount).toFixed(2)}</strong></div>)}{!homecareRequests.some(item=>item.paidAmount)&&<p className="hc-muted">No test transactions recorded yet.</p>}</section>}
    {section === "account" && <div className="hc-account-grid"><section className="hc-card"><div className="hc-card-head"><div><h2>Provider profile and services</h2><p>Set the service name, working area and hourly prices.</p></div></div><form className="hc-form" onSubmit={saveSettings}><label>Provider / organisation name<input value={settings.providerName} onChange={e=>setSettings({...settings,providerName:e.target.value})} placeholder="Registered provider name" maxLength={120}/></label><label>Service area<input value={settings.serviceArea} onChange={e=>setSettings({...settings,serviceArea:e.target.value})} placeholder="Suburbs / towns served" maxLength={250}/></label><label>Working hours<input value={settings.workingHours} onChange={e=>setSettings({...settings,workingHours:e.target.value})} maxLength={100}/></label><label>Approval status<select value={settings.approvalStatus} onChange={e=>setSettings({...settings,approvalStatus:e.target.value})}><option value="pending">Pending admin approval</option><option value="approved">Approved</option><option value="suspended">Suspended</option></select></label><h3>Hourly service rates (ZAR)</h3><p className="hc-muted">Enter real rates configured by your organisation. The patient booking flow cannot proceed to test payment until a rate is set.</p>{Object.entries(serviceNames).map(([key,label])=><label key={key}>{label} · R per hour<input type="number" min="1" step="0.01" value={settings.hourlyRates?.[key]||""} onChange={e=>setSettings({...settings,hourlyRates:{...settings.hourlyRates,[key]:e.target.value}})} placeholder="Enter rate"/></label>)}<button className="hc-primary" type="submit"><Save size={16}/> Save provider settings</button></form></section>
      <section className="hc-card"><div className="hc-card-head"><div><h2>Care team</h2><p>Add the people who may be assigned to visits.</p></div></div><form className="hc-form" onSubmit={saveMember}><label>Full legal name<input value={member.fullName} onChange={e=>setMember({...member,fullName:e.target.value})} required maxLength={120}/></label><label>Role<input value={member.role} onChange={e=>setMember({...member,role:e.target.value})} required maxLength={80}/></label><label>Qualifications<input value={member.qualifications} onChange={e=>setMember({...member,qualifications:e.target.value})} required placeholder="Verified qualification(s)" maxLength={300}/></label><label>Experience<input value={member.experience} onChange={e=>setMember({...member,experience:e.target.value})} required placeholder="e.g. 5 years in homecare" maxLength={200}/></label><label>Profile photo URL (optional)<input type="url" value={member.photoUrl} onChange={e=>setMember({...member,photoUrl:e.target.value})} placeholder="https://…" /></label><label>Availability<select value={member.availability} onChange={e=>setMember({...member,availability:e.target.value})}><option>Available</option><option>Unavailable</option></select></label><div className="hc-form-actions"><button className="hc-primary" type="submit"><Plus size={16}/>{editingMemberId?"Update team member":"Add team member"}</button>{editingMemberId&&<button className="hc-secondary" type="button" onClick={()=>{setMember(blankMember);setEditingMemberId("");}}>Cancel edit</button>}</div></form><div className="hc-team-list">{team.map(person=><article className="hc-team-card" key={person.id}>{person.photoUrl?<img src={person.photoUrl} alt={person.fullName}/>:<span className="hc-avatar"><UserRound size={23}/></span>}<div><strong>{person.fullName}</strong><p>{person.role} · {person.availability}</p><small>{person.qualifications}</small><small>{person.experience}</small></div><button className="hc-secondary" onClick={()=>{setMember(person);setEditingMemberId(person.id);}}>Edit</button></article>)}{!team.length&&<p className="hc-muted">Add care team members before assigning a booking. Verify qualifications and approval outside this local preview.</p>}</div></section></div>}
    <footer className="hc-footer"><ShieldCheck size={16}/><span>Local test mode: bookings, messages, team profiles and test payments are stored only in this browser. No real payment, online messaging, identity verification or provider notification is connected.</span></footer>
  </section>;
}
