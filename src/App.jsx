import { useState } from "react";
import {
  Activity, ArrowRight, Bell, CalendarDays, ChevronRight,
  HeartPulse, Home, MapPin, Pill, Moon, Sun,
  ShieldCheck, Stethoscope, UserRound, Video, Phone,
  Upload, House, MessageCircle, AlertCircle, X, Mail, MapPin, LockKeyhole, BellRing, LogOut, Save
} from "lucide-react";
import BookingFlow from "./BookingFlow.jsx";
import ProviderWorkspace from "./ProviderWorkspace.jsx";
import { PatientMedicineShop, TestRoleWorkspace, TestingAuth, TestingLanding } from "./TestingPortal.jsx";

const navItems = [
  { id:"home", label:"Home", icon:Home },
  { id:"activities", label:"Activities", icon:Activity },
  { id:"account", label:"Account", icon:UserRound }
];

function Brand() {
  return <div className="brand"><div className="brand-mark"><HeartPulse size={22}/></div><div><strong>HealthReachCare</strong></div></div>;
}

function App() {
  const [page, setPage] = useState("landing");
  const [user] = useState(null);
  const [accountDetails, setAccountDetails] = useState(() => {
    const defaults = {name:"",phone:"",email:"",dob:"",address:"",careNotifications:true,medicationReminders:true,announcements:true};
    try { return {...defaults, ...JSON.parse(localStorage.getItem("healthreachcare-test-account") || "{}")}; } catch { return defaults; }
  });
  const [notifications, setNotifications] = useState([]);
  const [notificationError] = useState("Testing mode: notifications are not connected.");
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkBackground, setDarkBackground] = useState(false);
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

    <div className="dashboard-panel">
      <div className="dashboard-panel-heading">
        <span className="dashboard-panel-icon tracker-icon"><Activity size={20}/></span>
        <div><div className="eyebrow">YOUR CARE JOURNEY</div><h2>Care tracker</h2><p>Follow the progress of your appointments and care requests.</p></div>
      </div>
      <div className="tracker-layout">
        <div className="tracker-timeline">
          <div className="timeline-step"><span className="timeline-dot"><CalendarDays size={17}/></span><div><strong>Request care when you need it</strong><p>Choose a doctor, homecare service or medicine order from the Home screen.</p></div></div>
          <div className="timeline-step"><span className="timeline-dot muted-dot"><Bell size={17}/></span><div><strong>Check Activities for updates</strong><p>Requests created in this browser appear in Activities while this test preview is in use.</p></div></div>
          <div className="timeline-step"><span className="timeline-dot muted-dot"><ShieldCheck size={17}/></span><div><strong>Provider and payment connections pending</strong><p>This preview does not contact a real provider or confirm real appointments or payments.</p></div></div>
        </div>
        <div className="tracker-map-placeholder"><HeartPulse size={30}/><strong>Your care, in one place</strong><p>Once connected, confirmed requests and their status will be shown here. No live tracking is available in this preview.</p></div>
      </div>
    </div>
    <div className="dashboard-panel">
      <div className="dashboard-panel-heading recent-heading">
        <span className="dashboard-panel-icon recent-icon"><Activity size={20}/></span>
        <div><div className="eyebrow">YOUR LATEST UPDATES</div><h2>Recent activity</h2><p>A quick look at your latest care requests.</p></div>
        <button className="text-button" onClick={() => setPage("activities")}>View activities <ArrowRight size={15}/></button>
      </div>
      {(() => { let items = []; try { items = JSON.parse(localStorage.getItem("healthreachcare-test-bookings") || "[]"); } catch {} return items.length ? items.slice(0,3).map(item => <div className="notification-item" key={item.id}><span className="notification-dot"/><div><strong>{item.serviceType || "Care request"}</strong><p>{item.requestedDate || "Date not set"} · {item.requestedTime || "Time not set"} · {String(item.status || "pending").replace(/_/g," ")}</p><small>Local test request · {item.providerName || "Provider not assigned"}</small></div></div>) : <div className="dashboard-empty recent-empty"><CalendarDays size={24}/><div><strong>No recent activity yet</strong><p>Your appointments and homecare requests will appear here after you create one.</p></div></div>; })()}
    </div>

  </section>;

  const renderActivities = () => { let careRequests=[]; try { careRequests=JSON.parse(localStorage.getItem("healthreachcare-test-bookings")||"[]"); } catch {} return <section className="page-content"><div className="eyebrow">YOUR HEALTH JOURNEY</div><h1>Activities</h1><p className="lead">Your care requests and updates.</p><div className="panel"><div className="panel-heading"><div className="panel-icon"><CalendarDays/></div><div><h2>Care requests</h2><p>Requests made in this browser</p></div></div>{careRequests.length ? careRequests.map(item=><div className="notification-item" key={item.id}><span className="notification-dot"/><div><strong>{item.serviceType || "Care request"}</strong><p>{item.requestedDate || "Date not set"} · {item.requestedTime || "Time not set"} · {String(item.status || "pending").replace(/_/g," ")}</p><small>Test request · {item.providerName || "Provider review pending"}</small></div></div>) : <div className="empty-state"><CalendarDays size={26}/><h3>No care requests yet</h3><p>Your homecare and appointment requests will appear here.</p></div>}</div><div className="panel"><div className="panel-heading"><div className="panel-icon"><Bell/></div><div><h2>Notifications</h2><p>Account updates</p></div></div>{notificationError ? <div className="inline-message"><AlertCircle size={18}/><span>Notifications will appear here when connected.</span></div> : notifications.length ? notifications.map(n=><div className="notification-item" key={n.id}><span className="notification-dot"/><div><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p></div></div>) : <div className="empty-state"><Bell size={26}/><h3>No notifications yet</h3><p>Updates will appear here when available.</p></div>}</div></section>; };

  const renderMedicines = () => <section className="page-content"><div className="eyebrow">PHARMACY SERVICES</div><h1>Order medication</h1><p className="lead">Find medication through participating pharmacies.</p><div className="panel"><div className="panel-heading"><div className="panel-icon blue"><Pill/></div><div><h2>Medicine catalogue</h2><p>Live pharmacy inventory will appear here when connected.</p></div></div><div className="inline-message"><AlertCircle size={18}/><span>Testing mode is active. Live pharmacy stock is not connected; no invented products or prices are shown.</span></div><button className="button button-primary" onClick={()=>openForm("prescription")}>Submit a prescription enquiry <ArrowRight size={16}/></button></div></section>;

  const renderAccount = () => <section className="page-content account-page">
    <div className="eyebrow">YOUR ACCOUNT</div><h1>Account</h1><p className="lead">Manage your profile, contact details and preferences.</p>
    <div className="panel account-panel">
      <div className="account-avatar"><UserRound size={28}/></div>
      <div><h2>Patient profile</h2><p className="muted">Profile settings in this preview are saved only in this browser.</p></div>
      <span className="account-status"><span className="status-dot status-muted"/>Preview mode</span>
    </div>
    <form className="panel account-settings-form" onSubmit={event => { event.preventDefault(); try { localStorage.setItem("healthreachcare-test-account", JSON.stringify(accountDetails)); setNotice("Your profile changes were saved in this browser only."); } catch { setNotice("Could not save your profile in this browser. Check storage settings."); } }}>
      <div className="panel-heading"><div className="panel-icon"><UserRound/></div><div><h2>Personal and contact details</h2><p>Keep your patient profile details up to date.</p></div></div>
      <div className="account-fields-grid">
        <label>Full name<input value={accountDetails.name} onChange={e=>setAccountDetails({...accountDetails,name:e.target.value})} placeholder="Enter your full name" autoComplete="name"/></label>
        <label>Phone number<input type="tel" value={accountDetails.phone} onChange={e=>setAccountDetails({...accountDetails,phone:e.target.value})} placeholder="e.g. 082 123 4567" autoComplete="tel"/></label>
        <label>Email address<input type="email" value={accountDetails.email} onChange={e=>setAccountDetails({...accountDetails,email:e.target.value})} placeholder="you@example.com" autoComplete="email"/></label>
        <label>Date of birth<input type="date" value={accountDetails.dob} onChange={e=>setAccountDetails({...accountDetails,dob:e.target.value})} /></label>
        <label className="account-address-field">Home address<input value={accountDetails.address} onChange={e=>setAccountDetails({...accountDetails,address:e.target.value})} placeholder="Street, suburb, town or city" autoComplete="street-address"/></label>
      </div>
      <div className="account-form-actions"><button className="button button-primary" type="submit"><Save size={16}/> Save profile</button><span className="muted small">Local preview only — not synced to a server.</span></div>
    </form>
    <div className="panel">
      <div className="panel-heading"><div className="panel-icon"><LockKeyhole/></div><div><h2>Login and security</h2><p>Secure access and account verification.</p></div></div>
      <div className="account-setting-row"><span className="account-setting-icon"><Mail size={18}/></span><div><strong>Email verification</strong><p className="muted">Not available — sign-in and email verification are not connected yet.</p></div><span className="account-status">Not connected</span></div>
      <div className="account-setting-row"><span className="account-setting-icon"><LockKeyhole size={18}/></span><div><strong>Password and sign-in</strong><p className="muted">Password changes and secure login require the authentication service to be connected.</p></div><span className="account-status">Pending</span></div>
    </div>
    <div className="panel">
      <div className="panel-heading"><div className="panel-icon"><BellRing/></div><div><h2>Notification preferences</h2><p>Choose the updates you would like to receive in the connected app.</p></div></div>
      <label className="account-preference"><span><strong>Appointment and care updates</strong><small>Booking status and provider responses</small></span><input type="checkbox" checked={accountDetails.careNotifications} onChange={e=>setAccountDetails({...accountDetails,careNotifications:e.target.checked})}/></label>
      <label className="account-preference"><span><strong>Medication reminders</strong><small>Reminders you set for your medicines</small></span><input type="checkbox" checked={accountDetails.medicationReminders} onChange={e=>setAccountDetails({...accountDetails,medicationReminders:e.target.checked})}/></label>
      <label className="account-preference"><span><strong>Service announcements</strong><small>Important HealthReachCare service information</small></span><input type="checkbox" checked={accountDetails.announcements} onChange={e=>setAccountDetails({...accountDetails,announcements:e.target.checked})}/></label>
      <button className="button button-outline account-save-preferences" onClick={()=>{try{localStorage.setItem("healthreachcare-test-account",JSON.stringify(accountDetails));setNotice("Your preferences were saved in this browser only.");}catch{setNotice("Could not save preferences in this browser.");}}}><Save size={16}/> Save preferences</button>
    </div>
    <div className="panel">
      <div className="panel-heading"><div className="panel-icon"><ShieldCheck/></div><div><h2>Privacy and consent</h2><p>Use test information only until secure account services are connected.</p></div></div>
      <div className="inline-message"><AlertCircle size={18}/><span>This preview is not a secure medical record system. Do not enter sensitive health information. Profile settings are stored locally on this device and are not sent to HealthReachCare.</span></div>
    </div>
    <div className="panel">
      <div className="panel-heading"><div className="panel-icon"><MessageCircle/></div><div><h2>Help and support</h2><p>Need help with an appointment, medicine order or homecare request?</p></div></div>
      <p className="muted">Support contact details have not yet been configured.</p>
      <button className="button button-outline" onClick={()=>setNotice("Support contact details need to be configured.")}><MessageCircle size={17}/> Contact support</button>
    </div>
    <div className="panel account-logout-panel"><div><h2>Sign out</h2><p className="muted">The current preview does not have a signed-in account session.</p></div><button className="button button-outline" onClick={()=>{setPage("landing");setNotice("");}}><LogOut size={16}/> Return to welcome screen</button></div>
    {notice && <div className="inline-message"><AlertCircle size={18}/><span>{notice}</span></div>}
  </section>;

  if (page === "landing") return <TestingLanding onOpenAuth={() => setPage("auth")} />;
  if (page === "auth") return <TestingAuth onBack={() => setPage("landing")} onOpenRole={role => setPage(role === "patient" ? "home" : role === "doctor" ? "doctor-provider" : role === "homecare" ? "homecare-provider" : "test-" + role)} />;
  if (page.startsWith("test-")) return <TestRoleWorkspace role={page.slice(5)} onBack={() => setPage("auth")} />;

  return <div className={darkBackground ? "app-shell dark-background" : "app-shell"}>
    <header className="topbar"><button className="brand-button" onClick={()=>setPage("home")}><Brand/></button><div className="topbar-right"><button className="icon-button theme-toggle" aria-label={darkBackground ? "Use light background" : "Use dark background"} title={darkBackground ? "Use light background" : "Use dark background"} onClick={()=>setDarkBackground(value=>!value)}>{darkBackground ? <Sun size={19}/> : <Moon size={19}/>}</button><button className="icon-button notification-button" aria-label="Show notifications" onClick={()=>setShowNotifications(!showNotifications)}><Bell size={20}/>{notifications.some(n=>!n.read && !n.isRead) && <span className="unread-dot"/>}</button><button className="profile-button" onClick={()=>setPage("account")}><span className="profile-circle"><UserRound size={17}/></span><span>{user?.displayName?.split(" ")[0] || "Account"}</span></button></div>
    {showNotifications && <div className="notification-popover"><div className="popover-head"><strong>Notifications</strong><button onClick={()=>setShowNotifications(false)} aria-label="Close notifications"><X size={17}/></button></div>{notificationError ? <p className="muted small">{notificationError}</p> : notifications.length ? notifications.slice(0,5).map(n=><div className="popover-notice" key={n.id}><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p></div>) : <p className="muted small">No new notifications.</p>}<button className="text-button" onClick={()=>{setPage("activities");setShowNotifications(false);}}>View all activities <ArrowRight size={15}/></button></div>}
</header>
    <main>{page === "doctor-booking" ? <BookingFlow type="doctor" user={user} onBack={()=>setPage("home")} onOpenActivities={()=>setPage("activities")}/> : page === "homecare-booking" ? <BookingFlow type="homecare" user={user} onBack={()=>setPage("home")} onOpenActivities={()=>setPage("activities")}/> : page === "doctor-provider" ? <ProviderWorkspace role="doctor" onBack={()=>setPage("home")}/> : page === "homecare-provider" ? <ProviderWorkspace role="homecare" onBack={()=>setPage("home")}/> : page === "home" ? renderHome() : page === "activities" ? renderActivities() : page === "medicines" ? <PatientMedicineShop onBack={() => setPage("home")} /> : renderAccount()}</main>
    
    <nav className="bottom-nav" aria-label="Main navigation">{navItems.map(item=>{const Icon=item.icon;const active=(item.id==="activities" && page==="activities") || (item.id==="account" && page==="account") || (item.id==="home" && ["home","medicines"].includes(page));return <button key={item.id} className={active?"nav-item active":"nav-item"} onClick={()=>setPage(item.id)}><Icon size={21}/><span>{item.label}</span></button>})}</nav>
    {formType && <div className="modal-backdrop" onClick={()=>setFormType("")}><section className="request-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">HEALTHREACHCARE REQUEST</div><h2>{formType==="appointment"?"Request an appointment":formType==="homecare"?"Request home care":"Prescription enquiry"}</h2></div><button className="icon-button" aria-label="Close" onClick={()=>setFormType("")}><X/></button></div>{notice && <div className="inline-message"><AlertCircle size={18}/><span>{notice}</span></div>}<p className="muted">{formType==="appointment" ? "Request a time with a verified practitioner. Your request remains pending until the provider confirms availability." : formType==="homecare" ? "Tell us what care you need and when. A provider must review and accept your request before it is confirmed." : "Send a prescription enquiry for the HealthReachCare team to review."}</p><form onSubmit={submitForm}><label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Phone number<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="e.g. 082 123 4567"/></label><label>{formType==="homecare"?"Care address / town or suburb":"Town or suburb"}<input required value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Where do you need care?"/></label>{formType!=="prescription" && <><label>{formType==="appointment"?"Preferred consultation":"Home-care service"}<select required value={form.service} onChange={e=>setForm({...form,service:e.target.value})}><option value="">Choose an option</option>{(formType==="appointment"?["In-Person","Video","Phone"]:["Nursing care","Personal care","Post-operative care","Elder care","Wound care","Other"]).map(option=><option key={option} value={option}>{option}</option>)}</select></label><div className="filter-row"><label>Preferred date<input required type="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Preferred time<input required type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div>{formType==="homecare" && <label>Requested duration<select value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}>{["1 hour","2 hours","4 hours","8 hours","Overnight","Ongoing / to be discussed"].map(option=><option key={option}>{option}</option>)}</select></label>}</>}{formType==="appointment" && form.doctorName && <div className="inline-message"><Stethoscope size={17}/><span>Practitioner selected: <strong>{form.doctorName}</strong></span></div>}<label>{formType==="prescription"?"Prescription enquiry (do not include sensitive medical information)":"Additional details"}<textarea required value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Briefly describe what you need" rows={3}/></label><div className="inline-message"><ShieldCheck size={17}/><span>Test mode saves this enquiry in this browser only. It is not sent to a provider and no payment is taken. Do not use this form for emergencies or enter sensitive medical records.</span></div><button className="button button-primary full" type="submit" disabled={submittingRequest}>{submittingRequest ? "Sending request…" : "Save test enquiry"} <ArrowRight size={16}/></button></form></section></div>}
  </div>;
}

export default App;
