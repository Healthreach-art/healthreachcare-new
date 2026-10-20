import { useState } from "react";
import {
  Activity, ArrowRight, Bell, CalendarDays, ChevronRight,
  HeartPulse, Home, MapPin, Pill,
  ShieldCheck, Stethoscope, UserRound, Video, Phone,
  Upload, House, MessageCircle, AlertCircle, X
} from "lucide-react";
import BookingFlow from "./BookingFlow.jsx";
import ProviderWorkspace from "./ProviderWorkspace.jsx";
import { TestRoleWorkspace, TestingAuth, TestingLanding } from "./TestingPortal.jsx";

const navItems = [
  { id:"home", label:"Home", icon:Home },
  { id:"activities", label:"Activities", icon:Activity },
  { id:"account", label:"Account", icon:UserRound }
];

function Brand() {
  return <div className="brand"><div className="brand-mark"><HeartPulse size={22}/></div><div><strong>HealthReachCare</strong><small>Better access. Healthier communities.</small></div></div>;
}

function App() {
  const [page, setPage] = useState("landing");
  const [user] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationError] = useState("Testing mode: notifications are not connected.");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notice, setNotice] = useState("");
  const [formType, setFormType] = useState("");
  const [form, setForm] = useState({name:"",phone:"",details:"",location:"",date:"",time:"",service:"",duration:"",doctorId:"",doctorName:""});
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const openForm = (type, extra = {}) => {
    setNotice("");
    setFormType(type);
    setForm({
      name:user?.displayName || "",
      phone:"",
      details:"",
      location:"",
      date:"",
      time:"",
      service:"",
      duration:"2 hours",
      doctorId:extra.doctorId || "",
      doctorName:extra.doctorName || ""
    });
  };

  const submitForm = event => {
    event.preventDefault();
    setNotice("This request form is a UI preview only. No account, booking, prescription, provider notification or payment service is connected, so nothing was submitted.");
    setFormType("");
    setSubmittingRequest(false);
  };

  const renderHome = () => <section className="page-content">
    <div className="hero">
      <div className="hero-copy">
        <div className="eyebrow light">YOUR HEALTH, MADE SIMPLER</div>
        <h1>Welcome{user?.displayName ? ", " + user.displayName.split(" ")[0] : ""} 👋</h1>
        <p>Your health is our priority. Let’s take care of it today.</p>
        <button className="button button-white" onClick={()=>setPage("doctor-booking")}>Book a doctor <ArrowRight size={17}/></button>
        <div className="hero-address"><MapPin size={16}/><span>Delivery location</span><strong>Set your address when ordering</strong></div>
      </div>
      <div className="hero-art"><div className="hero-circle"><HeartPulse size={66}/></div><span className="hero-dot dot-one"/><span className="hero-dot dot-two"/></div>
    </div>
    {notice && <div className="notice"><AlertCircle size={18}/><span>{notice}</span><button aria-label="Dismiss message" onClick={()=>setNotice("")}><X size={17}/></button></div>}
    <div className="section-heading"><div><div className="eyebrow">HEALTHCARE, ALL IN ONE PLACE</div><h2>How can we help you?</h2></div><span className="section-note">Choose a service to get started</span></div>
    <div className="service-grid">
      <button className="service-card" onClick={()=>setPage("medicines")}><span className="service-icon green"><Pill/></span><strong>Order Medication</strong><span>Get your prescriptions filled and delivered to your location</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>setPage("doctor-booking")}><span className="service-icon blue"><CalendarDays/></span><strong>Book Doctor Appointment</strong><span>Find a doctor and request a consultation</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>setPage("homecare-booking")}><span className="service-icon lilac"><House/></span><strong>Request Homecare Services</strong><span>Arrange professional care in your home</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>openForm("prescription")}><span className="service-icon amber"><Upload/></span><strong>View Prescriptions</strong><span>Prepare and manage prescription requests</span><ChevronRight className="service-arrow"/></button>
    </div>

    <div className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <span className="dashboard-panel-icon reminder-icon"><Bell size={20}/></span>
        <div><div className="eyebrow">STAY ON SCHEDULE</div><h2>Medication Reminders</h2><p>Keep track of medicines you need to take.</p></div>
      </div>
      <div className="dashboard-empty">
        <CalendarDays size={25}/>
        <div><strong>No reminders scheduled yet</strong><p>Your medication reminders will appear here when you set them up.</p></div>
      </div>
    </div>

  </section>;

  const renderActivities = () => <section className="page-content"><div className="eyebrow">YOUR HEALTH JOURNEY</div><h1>Activities</h1><p className="lead">Keep track of updates related to your care.</p><div className="panel"><div className="panel-heading"><div className="panel-icon"><Bell/></div><div><h2>Notifications</h2><p>Updates from your HealthReachCare account</p></div></div>{notificationError ? <div className="inline-message"><AlertCircle size={18}/><span>{notificationError}</span></div> : notifications.length ? notifications.map(n=><div className="notification-item" key={n.id}><span className="notification-dot"/><div><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p>{n.createdAt?.toDate && <small>{n.createdAt.toDate().toLocaleString()}</small>}</div></div>) : <div className="empty-state"><Bell size={26}/><h3>No notifications yet</h3><p>When there are updates to your appointments, orders or requests, they will appear here.</p></div>}</div></section>;

  const renderMedicines = () => <section className="page-content"><div className="eyebrow">PHARMACY SERVICES</div><h1>Order medication</h1><p className="lead">Find medication through participating pharmacies.</p><div className="panel"><div className="panel-heading"><div className="panel-icon blue"><Pill/></div><div><h2>Medicine catalogue</h2><p>Live pharmacy inventory will appear here when connected.</p></div></div><div className="inline-message"><AlertCircle size={18}/><span>Testing mode is active. Live pharmacy stock is not connected; no invented products or prices are shown.</span></div><button className="button button-primary" onClick={()=>openForm("prescription")}>Submit a prescription enquiry <ArrowRight size={16}/></button></div></section>;

  const renderAccount = () => <section className="page-content">
    <div className="eyebrow">YOUR ACCOUNT</div><h1>Account</h1><p className="lead">Your HealthReachCare account connection will be added when the backend is selected.</p>
    <div className="panel account-panel"><div className="account-avatar"><UserRound size={28}/></div><div><h2>Account setup pending</h2><p className="muted">No authentication provider is installed or connected in this repository.</p></div><span className="account-status"><span className="status-dot status-muted"/>Not connected</span></div>
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><ShieldCheck/></div><div><h2>Ready for a future backend</h2><p>The UI is kept separate from the authentication and data-service layer so a backend can be added later without rebuilding the screens.</p></div></div><div className="inline-message"><AlertCircle size={18}/><span>No account is created, no personal information is stored, and no request or payment can be submitted from this preview.</span></div></div>
    <div className="panel"><h2>Need help?</h2><p className="muted">Contact HealthReachCare support for help with appointments, medicine orders or home care.</p><button className="button button-outline" onClick={()=>setNotice("Support contact details need to be configured.")}><MessageCircle size={17}/> Contact support</button></div>
  </section>;

  if (page === "landing") return <TestingLanding onOpenAuth={() => setPage("auth")} />;
  if (page === "auth") return <TestingAuth onBack={() => setPage("landing")} onOpenRole={role => setPage(role === "patient" ? "home" : "test-" + role)} />;
  if (page.startsWith("test-")) return <TestRoleWorkspace role={page.slice(5)} onBack={() => setPage("auth")} />;

  return <div className="app-shell">
    <header className="topbar"><button className="brand-button" onClick={()=>setPage("home")}><Brand/></button><div className="topbar-right"><span className="secure-label"><ShieldCheck size={15}/> Care you can trust</span><button className="icon-button notification-button" aria-label="Show notifications" onClick={()=>setShowNotifications(!showNotifications)}><Bell size={20}/>{notifications.some(n=>!n.read && !n.isRead) && <span className="unread-dot"/>}</button><button className="profile-button" onClick={()=>setPage("account")}><span className="profile-circle"><UserRound size={17}/></span><span>{user?.displayName?.split(" ")[0] || "Account"}</span></button></div>
    {showNotifications && <div className="notification-popover"><div className="popover-head"><strong>Notifications</strong><button onClick={()=>setShowNotifications(false)} aria-label="Close notifications"><X size={17}/></button></div>{notificationError ? <p className="muted small">{notificationError}</p> : notifications.length ? notifications.slice(0,5).map(n=><div className="popover-notice" key={n.id}><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p></div>) : <p className="muted small">No new notifications.</p>}<button className="text-button" onClick={()=>{setPage("activities");setShowNotifications(false);}}>View all activities <ArrowRight size={15}/></button></div>}
</header>
    <main>{page === "doctor-booking" ? <BookingFlow type="doctor" user={user} onBack={()=>setPage("home")}/> : page === "homecare-booking" ? <BookingFlow type="homecare" user={user} onBack={()=>setPage("home")}/> : page === "doctor-provider" ? <ProviderWorkspace role="doctor" onBack={()=>setPage("home")}/> : page === "homecare-provider" ? <ProviderWorkspace role="homecare" onBack={()=>setPage("home")}/> : page === "home" ? renderHome() : page === "activities" ? renderActivities() : page === "medicines" ? renderMedicines() : renderAccount()}</main>
    <footer className="site-footer"><Brand/><p>Better access. Healthier communities.</p><span>Healthcare information is not a substitute for professional medical advice.</span></footer>
    <nav className="bottom-nav" aria-label="Main navigation">{navItems.map(item=>{const Icon=item.icon;const active=(item.id==="activities" && page==="activities") || (item.id==="account" && page==="account") || (item.id==="home" && ["home","medicines"].includes(page));return <button key={item.id} className={active?"nav-item active":"nav-item"} onClick={()=>setPage(item.id)}><Icon size={21}/><span>{item.label}</span></button>})}</nav>
    {formType && <div className="modal-backdrop" onClick={()=>setFormType("")}><section className="request-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">HEALTHREACHCARE REQUEST</div><h2>{formType==="appointment"?"Request an appointment":formType==="homecare"?"Request home care":"Prescription enquiry"}</h2></div><button className="icon-button" aria-label="Close" onClick={()=>setFormType("")}><X/></button></div>{notice && <div className="inline-message"><AlertCircle size={18}/><span>{notice}</span></div>}<p className="muted">{formType==="appointment" ? "Request a time with a verified practitioner. Your request remains pending until the provider confirms availability." : formType==="homecare" ? "Tell us what care you need and when. A provider must review and accept your request before it is confirmed." : "Send a prescription enquiry for the HealthReachCare team to review."}</p><form onSubmit={submitForm}><label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Phone number<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="e.g. 082 123 4567"/></label><label>{formType==="homecare"?"Care address / town or suburb":"Town or suburb"}<input required value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Where do you need care?"/></label>{formType!=="prescription" && <><label>{formType==="appointment"?"Preferred consultation":"Home-care service"}<select required value={form.service} onChange={e=>setForm({...form,service:e.target.value})}><option value="">Choose an option</option>{(formType==="appointment"?["In-Person","Video","Phone"]:["Nursing care","Personal care","Post-operative care","Elder care","Wound care","Other"]).map(option=><option key={option} value={option}>{option}</option>)}</select></label><div className="filter-row"><label>Preferred date<input required type="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Preferred time<input required type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div>{formType==="homecare" && <label>Requested duration<select value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}>{["1 hour","2 hours","4 hours","8 hours","Overnight","Ongoing / to be discussed"].map(option=><option key={option}>{option}</option>)}</select></label>}</>}{formType==="appointment" && form.doctorName && <div className="inline-message"><Stethoscope size={17}/><span>Practitioner selected: <strong>{form.doctorName}</strong></span></div>}<label>{formType==="prescription"?"Prescription enquiry (do not include sensitive medical information)":"Additional details"}<textarea required value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Briefly describe what you need" rows={3}/></label><div className="inline-message"><ShieldCheck size={17}/><span>Test mode saves this enquiry in this browser only. It is not sent to a provider and no payment is taken. Do not use this form for emergencies or enter sensitive medical records.</span></div><button className="button button-primary full" type="submit" disabled={submittingRequest}>{submittingRequest ? "Sending request…" : "Save test enquiry"} <ArrowRight size={16}/></button></form></section></div>}
  </div>;
}

export default App;
