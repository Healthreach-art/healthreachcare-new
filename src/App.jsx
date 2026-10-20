import { useMemo, useState } from "react";
import {
  Activity, ArrowRight, Bell, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, Clock3, HeartPulse, Home, MapPin, Pill, Search,
  ShieldCheck, Stethoscope, Truck, UserRound, Users, Video, Phone, RefreshCw,
  Upload, House, MessageCircle, AlertCircle, X, Menu
} from "lucide-react";
import BookingFlow from "./BookingFlow.jsx";
import { PatientMedicineShop, TestRoleWorkspace, TestingAuth, TestingLanding } from "./TestingPortal.jsx";
import { useTestWorkflow } from "./test-workflow.js";

const specialties = ["All specialties","GP","Paediatrician","Cardiologist","Dermatologist","Gynaecologist","Psychiatrist","Psychologist","ENT","Ophthalmologist","Orthopaedic Surgeon","Neurologist","Endocrinologist","Urologist","Dentist","Physiotherapist"];
const navItems = [
  { id:"home", label:"Home", icon:Home },
  { id:"activities", label:"Activities", icon:Activity },
  { id:"search", label:"Search", icon:Search },
  { id:"account", label:"Account", icon:UserRound }
];

function Brand() {
  return <div className="brand"><div className="brand-mark"><HeartPulse size={22}/></div><div><strong>HealthReachCare</strong><small>Better access. Healthier communities.</small></div></div>;
}

function App() {
  const [page, setPage] = useState("landing");
  const [user] = useState(null);
  const workflow = useTestWorkflow();
  const testOrders = workflow.orders.filter(order => order.testOnly);
  const [showNavigation, setShowNavigation] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationError] = useState("Testing mode: notifications are not connected.");
  const [doctors] = useState(sampleDoctors);
  const [doctorState, setDoctorState] = useState("ready");
  const [doctorError, setDoctorError] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [specialty, setSpecialty] = useState("All specialties");
  const [mode, setMode] = useState("All modes");
  const [distance, setDistance] = useState("50 km");
  const [locationMessage, setLocationMessage] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notice, setNotice] = useState("");
  const [formType, setFormType] = useState("");
  const [form, setForm] = useState({name:"",phone:"",details:"",location:"",date:"",time:"",service:"",duration:"",doctorId:"",doctorName:""});
  const [submittingRequest, setSubmittingRequest] = useState(false);



  const filteredDoctors = useMemo(() => doctors.filter(d => {
    const name = String(d.name || d.fullName || [d.firstName,d.lastName].filter(Boolean).join(" ") || "");
    const spec = String(d.specialty || d.specialisation || "");
    const place = String(d.location || d.city || d.practiceAddress || "");
    const term = doctorSearch.trim().toLowerCase();
    return (!term || [name,spec,place].join(" ").toLowerCase().includes(term))
      && (specialty === "All specialties" || spec.toLowerCase().includes(specialty.toLowerCase()))
      && (mode === "All modes" || String(d.consultationModes || d.consultationMode || d.consultationType || "").toLowerCase().includes(mode.toLowerCase()));
  }), [doctors, doctorSearch, specialty, mode]);

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
    if (submittingRequest) return;
    setSubmittingRequest(true);
    const request = {
      id: "TEST-" + Date.now().toString(36).toUpperCase(),
      type: formType,
      patientName: form.name.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      details: form.details.trim(),
      status: "TEST ONLY — saved locally, not sent",
      paymentStatus: "Not collected",
      createdAt: new Date().toISOString()
    };
    try {
      const current = JSON.parse(localStorage.getItem("healthreachcare-test-bookings") || "[]");
      localStorage.setItem("healthreachcare-test-bookings", JSON.stringify([request, ...current]));
    } catch { /* The testing flow still works if browser storage is blocked. */ }
    setFormType("");
    setNotice("Test enquiry saved in this browser only. It was not sent to a provider and no payment was taken.");
    setSubmittingRequest(false);
  };

  const useLocation = () => {
    if (!navigator.geolocation) { setLocationMessage("Location is not supported by this browser."); return; }
    setLocationMessage("Requesting your permission…");
    navigator.geolocation.getCurrentPosition(
      position => setLocationMessage("Location permission granted. Nearby distance filtering needs to be enabled on verified practitioner records."),
      () => setLocationMessage("Location access was not granted. You can still search by town or suburb."),
      {timeout:8000}
    );
  };

  const renderDoctorDirectory = () => <section className="page-content">
    <div className="eyebrow">CARE THAT FITS YOUR NEEDS</div>
    <h1>Find the Right Doctor</h1>
    <p className="lead">Search verified healthcare professionals by specialty and location.</p>
    <div className="directory-tools">
      <label className="search-field"><Search size={19}/><input value={doctorSearch} onChange={e=>setDoctorSearch(e.target.value)} placeholder="Doctor, specialty or location"/></label>
      <div className="filter-row">
        <label><span>Specialty</span><select value={specialty} onChange={e=>setSpecialty(e.target.value)}>{specialties.map(s=><option key={s}>{s}</option>)}</select></label>
        <label><span>Consultation</span><select value={mode} onChange={e=>setMode(e.target.value)}>{["All modes","In-Person","Video","Phone"].map(s=><option key={s}>{s}</option>)}</select></label>
        <label><span>Distance</span><select value={distance} onChange={e=>setDistance(e.target.value)}>{["25 km","50 km","75 km","100 km"].map(s=><option key={s}>{s}</option>)}</select></label>
      </div>
      <button className="button button-outline" onClick={useLocation}><MapPin size={17}/> Use my location</button>
      {locationMessage && <p className="muted small">{locationMessage}</p>}
    </div>
    {doctorState === "loading" && <div className="state-card"><RefreshCw className="spin" size={22}/><div><strong>Loading verified practitioners</strong><p>Please wait while the directory connects.</p></div></div>}
    {(doctorState === "error" || doctorState === "config") && <div className="state-card state-error"><AlertCircle size={23}/><div><strong>{doctorState === "config" ? "Directory setup needed" : "We couldn’t load the doctor directory"}</strong><p>{doctorError}</p><button className="text-button" onClick={()=>{setDoctorState("ready");setDoctorError("");}}><RefreshCw size={15}/> Try again</button></div></div>}
    {doctorState === "ready" && (filteredDoctors.length ? <div className="doctor-grid">{filteredDoctors.map(d=><article className="doctor-card" key={d.id}><div className="doctor-avatar"><Stethoscope size={23}/></div><div className="verified"><ShieldCheck size={14}/> Verified practitioner</div><h3>{d.name || d.fullName || [d.firstName,d.lastName].filter(Boolean).join(" ") || "Healthcare professional"}</h3><p className="doctor-specialty">{d.specialty || d.specialisation || "Healthcare professional"}</p><p className="muted"><MapPin size={15}/> {d.location || d.city || d.practiceAddress || "Location not listed"}</p><button className="button button-primary full" onClick={()=>setPage("doctor-booking")}>Start booking <ArrowRight size={16}/></button></article>)}</div> : <div className="empty-state"><Users size={27}/><h3>No matching verified practitioners</h3><p>Try another specialty or location. Only verified records are shown.</p><button className="button button-outline" onClick={()=>{setDoctorSearch("");setSpecialty("All specialties");setMode("All modes");}}>Clear filters</button></div>)}
  </section>;

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

    <div className="dashboard-panel">
      <div className="dashboard-panel-heading tracker-heading">
        <span className="dashboard-panel-icon tracker-icon"><Truck size={20}/></span>
        <div><div className="eyebrow">ORDER UPDATES</div><h2>Delivery Tracker</h2><p>Follow your medication order from pharmacy to your door.</p></div>
        <span className="status-pill">{testOrders.length ? String(testOrders[0].status).replace(/_/g," ") : "No active order"}</span>
      </div>
      <div className="tracker-layout">
        <div className="tracker-timeline">
          <div className="timeline-step"><span className="timeline-dot"><CheckCircle2 size={17}/></span><div><strong>Order placed</strong><p>We’ll show your order progress here.</p></div></div>
          <div className="timeline-step"><span className="timeline-dot muted-dot"><Pill size={16}/></span><div><strong>Pharmacy preparing</strong><p>Waiting for an order to track.</p></div></div>
          <div className="timeline-step"><span className="timeline-dot muted-dot"><Truck size={16}/></span><div><strong>Out for delivery</strong><p>Driver and delivery updates appear here.</p></div></div>
          <div className="timeline-step"><span className="timeline-dot muted-dot"><House size={16}/></span><div><strong>Delivered</strong><p>Delivery completion will be shown here.</p></div></div>
        </div>
        <div className="tracker-map-placeholder">
          <MapPin size={30}/>
          <strong>Delivery map</strong>
          <p>A delivery map will appear when there is an active order with confirmed pickup and delivery locations.</p>
        </div>
      </div>
    </div>

    <div className="dashboard-panel">
      <div className="dashboard-panel-heading recent-heading">
        <span className="dashboard-panel-icon recent-icon"><ClipboardList size={20}/></span>
        <div><div className="eyebrow">YOUR ORDER HISTORY</div><h2>Recent Orders</h2><p>Review your latest medication orders and their status.</p></div>
        <button className="text-button" onClick={()=>setPage("medicines")}>Order medication <ArrowRight size={15}/></button>
      </div>
      {testOrders.length ? <div className="recent-order-list">{testOrders.slice(0,3).map(order=><article className="recent-order-row" key={order.id}><span className="dashboard-panel-icon recent-icon"><Pill size={18}/></span><div><strong>{order.id}</strong><p>{order.items.map(item=>item.quantity+" × "+item.name).join(", ")}</p><small>Payment: {String(order.paymentStatus).replace(/_/g," ")} · Status: {String(order.status).replace(/_/g," ")}</small></div><strong>R{Number(order.total || 0).toFixed(2)}</strong></article>)}<button className="button button-outline" onClick={()=>setPage("medicines")}>View all orders <ArrowRight size={15}/></button></div> : <div className="dashboard-empty recent-empty"><Pill size={25}/><div><strong>No recent orders yet</strong><p>Your test orders will appear here and update as the pharmacy and driver change their status.</p></div></div>}
    </div>
  </section>;

  const renderActivities = () => <section className="page-content"><div className="eyebrow">YOUR HEALTH JOURNEY</div><h1>Activities</h1><p className="lead">Keep track of updates related to your care.</p><div className="panel"><div className="panel-heading"><div className="panel-icon"><Bell/></div><div><h2>Notifications</h2><p>Updates from your HealthReachCare account</p></div></div>{notificationError ? <div className="inline-message"><AlertCircle size={18}/><span>{notificationError}</span></div> : notifications.length ? notifications.map(n=><div className="notification-item" key={n.id}><span className="notification-dot"/><div><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p>{n.createdAt?.toDate && <small>{n.createdAt.toDate().toLocaleString()}</small>}</div></div>) : <div className="empty-state"><Bell size={26}/><h3>No notifications yet</h3><p>When there are updates to your appointments, orders or requests, they will appear here.</p></div>}</div></section>;

  const renderMedicines = () => <section className="page-content"><div className="eyebrow">PHARMACY SERVICES</div><h1>Order medication</h1><p className="lead">Find medication through participating pharmacies.</p><div className="panel"><div className="panel-heading"><div className="panel-icon blue"><Pill/></div><div><h2>Medicine catalogue</h2><p>Live pharmacy inventory will appear here when connected.</p></div></div><div className="inline-message"><AlertCircle size={18}/><span>Testing mode is active. Live pharmacy stock is not connected; no invented products or prices are shown.</span></div><button className="button button-primary" onClick={()=>openForm("prescription")}>Submit a prescription enquiry <ArrowRight size={16}/></button></div></section>;

  const renderAccount = () => <section className="page-content">
    <div className="eyebrow">YOUR ACCOUNT</div><h1>Account</h1><p className="lead">You are using the open HealthReachCare test environment.</p>
    <div className="panel account-panel"><div className="account-avatar"><UserRound size={28}/></div><div><h2>Test Patient</h2><p className="muted">No account or login required in this testing build.</p></div><span className="account-status"><span className="status-dot status-muted"/>Guest test access</span></div>
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><ShieldCheck/></div><div><h2>Testing mode</h2><p>Local test records only</p></div></div><p className="muted">Bookings, pharmacy orders and payment simulations use this browser's local storage. They are not sent to real providers and are not suitable for real patient information.</p><button className="button button-primary" onClick={()=>setPage("landing")}>Return to testing landing page <ArrowRight size={16}/></button></div>
    <div className="panel"><h2>Need help?</h2><p className="muted">Support contact details will be configured before launch.</p><button className="button button-outline" onClick={()=>setNotice("Support contact details have not been configured in test mode.")}><MessageCircle size={17}/> Contact support</button></div>
  </section>;

  if (page === "landing") return <TestingLanding onOpenAuth={() => setPage("auth")} />;
  if (page === "auth") return <TestingAuth onBack={() => setPage("landing")} onOpenRole={role => setPage(role === "patient" ? "home" : "test-" + role)} />;
  if (page.startsWith("test-")) return <TestRoleWorkspace role={page.slice(5)} onBack={() => setPage("auth")} />;

  return <div className="app-shell">
    <header className="topbar"><button className="brand-button" onClick={()=>setPage("landing")}><Brand/></button><div className="topbar-right"><button className="navigation-button" aria-label="Open navigation menu" aria-expanded={showNavigation} onClick={()=>setShowNavigation(value=>!value)}><Menu size={20}/><span>Navigate</span></button><span className="secure-label"><ShieldCheck size={15}/> Care you can trust</span><button className="icon-button notification-button" aria-label="Show notifications" onClick={()=>setShowNotifications(!showNotifications)}><Bell size={20}/>{notifications.some(n=>!n.read && !n.isRead) && <span className="unread-dot"/>}</button><button className="profile-button" onClick={()=>setPage("account")}><span className="profile-circle"><UserRound size={17}/></span><span>{user?.displayName?.split(" ")[0] || "Account"}</span></button></div>
    {showNavigation && <div className="navigation-popover" role="dialog" aria-label="Patient navigation"><div className="popover-head"><strong>Navigate HealthReachCare</strong><button onClick={()=>setShowNavigation(false)} aria-label="Close navigation"><X size={17}/></button></div><button className="navigation-link" onClick={()=>{setPage("landing");setShowNavigation(false);}}><Home size={18}/><span>Public landing page</span><ChevronRight size={16}/></button><button className="navigation-link" onClick={()=>{setPage("auth");setShowNavigation(false);}}><ShieldCheck size={18}/><span>Sign in / demo access</span><ChevronRight size={16}/></button><button className="navigation-link" onClick={()=>{setPage("home");setShowNavigation(false);}}><HeartPulse size={18}/><span>Patient home</span><ChevronRight size={16}/></button><button className="navigation-link" onClick={()=>{setPage("medicines");setShowNavigation(false);}}><Pill size={18}/><span>Order medication</span><ChevronRight size={16}/></button></div>}
    {showNotifications && <div className="notification-popover"><div className="popover-head"><strong>Notifications</strong><button onClick={()=>setShowNotifications(false)} aria-label="Close notifications"><X size={17}/></button></div>{notificationError ? <p className="muted small">{notificationError}</p> : notifications.length ? notifications.slice(0,5).map(n=><div className="popover-notice" key={n.id}><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p></div>) : <p className="muted small">No new notifications.</p>}<button className="text-button" onClick={()=>{setPage("activities");setShowNotifications(false);}}>View all activities <ArrowRight size={15}/></button></div>}
</header>
    <main>{page === "doctor-booking" ? <BookingFlow type="doctor" user={user} onBack={()=>setPage("home")}/> : page === "homecare-booking" ? <BookingFlow type="homecare" user={user} onBack={()=>setPage("home")}/> : page === "home" ? renderHome() : page === "search" ? renderDoctorDirectory() : page === "activities" ? renderActivities() : page === "medicines" ? <PatientMedicineShop onBack={()=>setPage("home")}/> : renderAccount()}</main>
    <footer className="site-footer"><Brand/><p>Better access. Healthier communities.</p><span>Healthcare information is not a substitute for professional medical advice.</span></footer>
    <nav className="bottom-nav" aria-label="Main navigation">{navItems.map(item=>{const Icon=item.icon;const active=(item.id==="search" && page==="search") || (item.id==="activities" && page==="activities") || (item.id==="account" && page==="account") || (item.id==="home" && ["home","medicines"].includes(page));return <button key={item.id} className={active?"nav-item active":"nav-item"} onClick={()=>setPage(item.id)}><Icon size={21}/><span>{item.label}</span></button>})}</nav>
    {formType && <div className="modal-backdrop" onClick={()=>setFormType("")}><section className="request-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">HEALTHREACHCARE REQUEST</div><h2>{formType==="appointment"?"Request an appointment":formType==="homecare"?"Request home care":"Prescription enquiry"}</h2></div><button className="icon-button" aria-label="Close" onClick={()=>setFormType("")}><X/></button></div>{notice && <div className="inline-message"><AlertCircle size={18}/><span>{notice}</span></div>}<p className="muted">{formType==="appointment" ? "Request a time with a verified practitioner. Your request remains pending until the provider confirms availability." : formType==="homecare" ? "Tell us what care you need and when. A provider must review and accept your request before it is confirmed." : "Send a prescription enquiry for the HealthReachCare team to review."}</p><form onSubmit={submitForm}><label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Phone number<input required type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="e.g. 082 123 4567"/></label><label>{formType==="homecare"?"Care address / town or suburb":"Town or suburb"}<input required value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Where do you need care?"/></label>{formType!=="prescription" && <><label>{formType==="appointment"?"Preferred consultation":"Home-care service"}<select required value={form.service} onChange={e=>setForm({...form,service:e.target.value})}><option value="">Choose an option</option>{(formType==="appointment"?["In-Person","Video","Phone"]:["Nursing care","Personal care","Post-operative care","Elder care","Wound care","Other"]).map(option=><option key={option} value={option}>{option}</option>)}</select></label><div className="filter-row"><label>Preferred date<input required type="date" min={new Date().toISOString().slice(0,10)} value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label><label>Preferred time<input required type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})}/></label></div>{formType==="homecare" && <label>Requested duration<select value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}>{["1 hour","2 hours","4 hours","8 hours","Overnight","Ongoing / to be discussed"].map(option=><option key={option}>{option}</option>)}</select></label>}</>}{formType==="appointment" && form.doctorName && <div className="inline-message"><Stethoscope size={17}/><span>Practitioner selected: <strong>{form.doctorName}</strong></span></div>}<label>{formType==="prescription"?"Prescription enquiry (do not include sensitive medical information)":"Additional details"}<textarea required value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Briefly describe what you need" rows={3}/></label><div className="inline-message"><ShieldCheck size={17}/><span>Test mode saves this enquiry in this browser only. It is not sent to a provider and no payment is taken. Do not use this form for emergencies or enter sensitive medical records.</span></div><button className="button button-primary full" type="submit" disabled={submittingRequest}>{submittingRequest ? "Sending request…" : "Save test enquiry"} <ArrowRight size={16}/></button></form></section></div>}
  </div>;
}

export default App;
