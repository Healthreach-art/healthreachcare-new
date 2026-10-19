import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { addDoc, collection, onSnapshot, query, orderBy, limit, serverTimestamp, where } from "firebase/firestore";
import {
  Activity, ArrowRight, Bell, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardList, Clock3, HeartPulse, Home, MapPin, Menu, Pill, Search,
  ShieldCheck, Stethoscope, Truck, UserRound, Users, Video, Phone, RefreshCw,
  Upload, House, MessageCircle, AlertCircle, X
} from "lucide-react";
import { auth, db, firebaseConfigured } from "./firebase";

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
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [requestError, setRequestError] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorState, setDoctorState] = useState("loading");
  const [doctorError, setDoctorError] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [specialty, setSpecialty] = useState("All specialties");
  const [mode, setMode] = useState("All modes");
  const [distance, setDistance] = useState("50 km");
  const [locationMessage, setLocationMessage] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notice, setNotice] = useState("");
  const [formType, setFormType] = useState("");
  const [form, setForm] = useState({name:"",phone:"",details:"",location:""});
  const [authMode, setAuthMode] = useState("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    if (!firebaseConfigured || !auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!db) {
      setDoctorState("config");
      setDoctorError("Doctor directory is not connected yet. Add the Firebase web configuration to enable live, verified practitioner records.");
      return;
    }
    setDoctorState("loading");
    setDoctorError("");
    const q = query(collection(db, "doctors"), limit(100));
    const unsubscribe = onSnapshot(q, snapshot => {
      const rows = snapshot.docs.map(d => ({ id:d.id, ...d.data() }));
      setDoctors(rows.filter(d => d.verified === true || d.isVerified === true || d.verificationStatus === "verified"));
      setDoctorState("ready");
    }, error => {
      setDoctorState("error");
      setDoctorError(error?.code === "permission-denied"
        ? "Your account cannot read the verified doctor directory. Check the Firestore read rules for published, verified doctor profiles."
        : "We couldn’t load the doctor directory. Check your connection and Firebase configuration, then try again.");
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!db || !user) {
      setNotifications([]);
      setNotificationError(!firebaseConfigured ? "Connect Firebase to receive live notifications." : !user ? "Sign in to view your personal notifications." : "");
      return;
    }
    const q = query(collection(db, "users", user.uid, "notifications"), orderBy("createdAt", "desc"), limit(20));
    return onSnapshot(q, snapshot => {
      setNotifications(snapshot.docs.map(d => ({id:d.id, ...d.data()})));
      setNotificationError("");
    }, () => setNotificationError("Notifications are temporarily unavailable. Check notification collection permissions."));
  }, [user]);

  useEffect(() => {
    if (!db || !user) {
      setServiceRequests([]);
      setRequestError("");
      return;
    }
    const requestQuery = query(collection(db, "serviceRequests"), where("patientUid", "==", user.uid), limit(30));
    return onSnapshot(requestQuery, snapshot => {
      const rows = snapshot.docs.map(d => ({ id:d.id, ...d.data() }));
      rows.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setServiceRequests(rows);
      setRequestError("");
    }, error => {
      setRequestError(error?.code === "permission-denied"
        ? "Your account cannot read request history. Check the serviceRequests Firestore rules."
        : "Your request history is temporarily unavailable. Please try again later.");
    });
  }, [user]);

  const filteredDoctors = useMemo(() => doctors.filter(d => {
    const name = String(d.name || d.fullName || [d.firstName,d.lastName].filter(Boolean).join(" ") || "");
    const spec = String(d.specialty || d.specialisation || "");
    const place = String(d.location || d.city || d.practiceAddress || "");
    const term = doctorSearch.trim().toLowerCase();
    return (!term || [name,spec,place].join(" ").toLowerCase().includes(term))
      && (specialty === "All specialties" || spec.toLowerCase().includes(specialty.toLowerCase()))
      && (mode === "All modes" || String(d.consultationModes || d.consultationMode || d.consultationType || "").toLowerCase().includes(mode.toLowerCase()));
  }), [doctors, doctorSearch, specialty, mode]);

  const openForm = type => {
    setFormType(type);
    setForm({name:user?.displayName || "",phone:"",details:"",location:""});
  };

  const submitForm = async event => {
    event.preventDefault();
    if (!firebaseConfigured || !auth || !db) {
      setNotice("Requests are unavailable because HealthReachCare has not been connected to its Firebase project yet. No request was sent.");
      return;
    }
    if (!user) {
      setNotice("Please sign in or create an account before submitting a request. Your request has not been sent.");
      setPage("account");
      setFormType("");
      return;
    }
    try {
      const serviceType = formType === "appointment" ? "appointment" : formType === "homecare" ? "homecare" : "prescription";
      await addDoc(collection(db, "serviceRequests"), {
        serviceType, status: "pending", patientUid: user.uid,
        patientName: form.name.trim() || user.displayName || "",
        patientEmail: user.email || "", phone: form.phone.trim(),
        location: form.location.trim(), details: form.details.trim(),
        createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      setFormType("");
      setForm({name:user.displayName || "",phone:"",details:"",location:""});
      setNotice("Your request was submitted. You can follow updates in Activities as provider workflows become available.");
      setPage("activities");
    } catch (error) {
      setNotice(error?.code === "permission-denied"
        ? "Your request could not be saved because Firestore security rules do not yet permit this request. No request was submitted."
        : "We could not submit your request. Please check your connection and try again. No confirmation has been recorded.");
    }
  };

  const handleAuth = async event => {
    event.preventDefault();
    if (!auth || !firebaseConfigured) { setAuthError("Firebase is not configured. Add the web app configuration before signing in."); return; }
    setAuthBusy(true); setAuthError("");
    try {
      if (authMode === "signup") {
        const credential = await createUserWithEmailAndPassword(auth, authEmail.trim(), authPassword);
        await updateProfile(credential.user, { displayName: authEmail.trim().split("@")[0] });
      } else await signInWithEmailAndPassword(auth, authEmail.trim(), authPassword);
      setAuthPassword(""); setAuthError("");
    } catch (error) {
      setAuthError(error?.code === "auth/email-already-in-use" ? "An account already exists for this email. Sign in instead."
        : error?.code === "auth/invalid-credential" ? "Email or password is incorrect."
        : error?.code === "auth/weak-password" ? "Choose a password with at least 6 characters."
        : error?.code === "auth/invalid-email" ? "Enter a valid email address."
        : "We could not complete sign-in. Check your details and Firebase Authentication settings.");
    } finally { setAuthBusy(false); }
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
    {(doctorState === "error" || doctorState === "config") && <div className="state-card state-error"><AlertCircle size={23}/><div><strong>{doctorState === "config" ? "Directory setup needed" : "We couldn’t load the doctor directory"}</strong><p>{doctorError}</p><button className="text-button" onClick={()=>{setDoctorState("loading");setDoctorError("");if(!db){setDoctorState("config");setDoctorError("Doctor directory is not connected yet. Add the Firebase web configuration to enable live, verified practitioner records.");}}}><RefreshCw size={15}/> Try again</button></div></div>}
    {doctorState === "ready" && (filteredDoctors.length ? <div className="doctor-grid">{filteredDoctors.map(d=><article className="doctor-card" key={d.id}><div className="doctor-avatar"><Stethoscope size={23}/></div><div className="verified"><ShieldCheck size={14}/> Verified practitioner</div><h3>{d.name || d.fullName || [d.firstName,d.lastName].filter(Boolean).join(" ") || "Healthcare professional"}</h3><p className="doctor-specialty">{d.specialty || d.specialisation || "Healthcare professional"}</p><p className="muted"><MapPin size={15}/> {d.location || d.city || d.practiceAddress || "Location not listed"}</p><button className="button button-primary full" onClick={()=>{setForm({name:user?.displayName || "",phone:"",details:"",location:""});setFormType("appointment");setNotice("Appointment requests are not submitted until the booking backend is connected.");}}>Request appointment <ArrowRight size={16}/></button></article>)}</div> : <div className="empty-state"><Users size={27}/><h3>No matching verified practitioners</h3><p>Try another specialty or location. Only verified records are shown.</p><button className="button button-outline" onClick={()=>{setDoctorSearch("");setSpecialty("All specialties");setMode("All modes");}}>Clear filters</button></div>)}
  </section>;

  const renderHome = () => <section className="page-content">
    <div className="hero">
      <div className="hero-copy"><div className="eyebrow light">YOUR HEALTH, MADE SIMPLER</div><h1>Welcome{user?.displayName ? ", " + user.displayName.split(" ")[0] : ""} 👋</h1><p>Your health is our priority. Let’s take care of it today.</p><button className="button button-white" onClick={()=>setPage("search")}>Find a doctor <ArrowRight size={17}/></button></div>
      <div className="hero-art"><div className="hero-circle"><HeartPulse size={66}/></div><span className="hero-dot dot-one"/><span className="hero-dot dot-two"/></div>
    </div>
    {notice && <div className="notice"><AlertCircle size={18}/><span>{notice}</span><button aria-label="Dismiss message" onClick={()=>setNotice("")}><X size={17}/></button></div>}
    <div className="section-heading"><div><div className="eyebrow">HEALTHCARE, ALL IN ONE PLACE</div><h2>How can we help you?</h2></div><span className="section-note">Choose a service to get started</span></div>
    <div className="service-grid">
      <button className="service-card" onClick={()=>setPage("search")}><span className="service-icon green"><Stethoscope/></span><strong>Book a doctor</strong><span>Find care and choose a time</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>setPage("medicines")}><span className="service-icon blue"><Pill/></span><strong>Order medication</strong><span>Get your medication delivered</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>openForm("homecare")}><span className="service-icon lilac"><House/></span><strong>Request home care</strong><span>Arrange care in your home</span><ChevronRight className="service-arrow"/></button>
      <button className="service-card" onClick={()=>openForm("prescription")}><span className="service-icon amber"><Upload/></span><strong>Upload prescription</strong><span>Prepare a prescription request</span><ChevronRight className="service-arrow"/></button>
    </div>
    <div className="section-heading compact"><div><div className="eyebrow">YOUR CARE JOURNEY</div><h2>Care you can count on</h2></div></div>
    <div className="trust-grid"><div><ShieldCheck/><strong>Verified professionals</strong><p>Practitioner listings are filtered for verification.</p></div><div><Clock3/><strong>Convenient access</strong><p>Explore care services from one place.</p></div><div><HeartPulse/><strong>Care around you</strong><p>Designed for patients and communities across South Africa.</p></div></div>
  </section>;

  const renderActivities = () => <section className="page-content"><div className="eyebrow">YOUR HEALTH JOURNEY</div><h1>Activities</h1><p className="lead">Keep track of your healthcare requests and account updates.</p><div className="panel"><div className="panel-heading"><div className="panel-icon"><ClipboardList/></div><div><h2>Your requests</h2><p>Appointment, homecare and prescription requests submitted by you</p></div></div>{!user ? <div className="inline-message"><AlertCircle size={18}/><span>Sign in to view requests linked to your account.</span><button className="text-button" onClick={()=>setPage("account")}>Sign in <ArrowRight size={14}/></button></div> : requestError ? <div className="inline-message"><AlertCircle size={18}/><span>{requestError}</span></div> : serviceRequests.length ? serviceRequests.map(r=><div className="notification-item" key={r.id}><span className="notification-dot"/><div><strong>{({appointment:"Doctor appointment",homecare:"Homecare",prescription:"Prescription enquiry",medicine:"Medicine order"})[r.serviceType] || "Healthcare request"}</strong><p>Status: {String(r.status || "pending").replaceAll("_"," ")}</p>{r.createdAt?.toDate && <small>{r.createdAt.toDate().toLocaleString()}</small>}</div></div>) : <div className="empty-state"><ClipboardList size={26}/><h3>No requests yet</h3><p>Requests you submit will appear here once they are saved to your account.</p></div>}</div><div className="panel"><div className="panel-heading"><div className="panel-icon"><Bell/></div><div><h2>Notifications</h2><p>Updates from your HealthReachCare account</p></div></div>{notificationError ? <div className="inline-message"><AlertCircle size={18}/><span>{notificationError}</span></div> : notifications.length ? notifications.map(n=><div className="notification-item" key={n.id}><span className="notification-dot"/><div><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p>{n.createdAt?.toDate && <small>{n.createdAt.toDate().toLocaleString()}</small>}</div></div>) : <div className="empty-state"><Bell size={26}/><h3>No notifications yet</h3><p>When there are updates to your appointments, orders or requests, they will appear here.</p></div>}</div></section>;

  const renderMedicines = () => <section className="page-content"><div className="eyebrow">PHARMACY SERVICES</div><h1>Order medication</h1><p className="lead">Find medication through participating pharmacies.</p><div className="panel"><div className="panel-heading"><div className="panel-icon blue"><Pill/></div><div><h2>Medicine catalogue</h2><p>Live pharmacy inventory will appear here when connected.</p></div></div>{!db ? <div className="inline-message"><AlertCircle size={18}/><span>Firebase is not configured yet, so stock and medicine availability cannot be loaded. We won’t show invented products or prices.</span></div> : <div className="inline-message"><RefreshCw size={18}/><span>The catalogue connection needs the approved medicines collection and pharmacy access rules before ordering can be enabled.</span></div>}<button className="button button-primary" onClick={()=>openForm("prescription")}>Submit a prescription enquiry <ArrowRight size={16}/></button></div></section>;

  const renderAccount = () => <section className="page-content"><div className="eyebrow">YOUR ACCOUNT</div><h1>Account</h1><p className="lead">Your personal HealthReachCare space.</p><div className="panel account-panel"><div className="account-avatar"><UserRound size={28}/></div><div><h2>{user?.displayName || "Welcome to HealthReachCare"}</h2><p className="muted">{user?.email || "Sign in to submit and track your healthcare requests."}</p></div><span className="account-status"><span className={user ? "status-dot" : "status-dot status-muted"}/>{user ? "Signed in" : "Guest"}</span></div>{user ? <div className="panel"><h2>You’re signed in</h2><p className="muted">Requests you submit are linked to this account.</p><button className="button button-outline" onClick={async()=>{await signOut(auth);setNotice("You have signed out.");}}><UserRound size={17}/> Sign out</button></div> : <div className="panel"><div className="panel-heading"><div className="panel-icon"><ShieldCheck/></div><div><h2>{authMode === "signup" ? "Create your account" : "Sign in"}</h2><p>Use your email to securely submit healthcare requests.</p></div></div><div className="filter-row"><button type="button" className={authMode === "signin" ? "button button-primary" : "button button-outline"} onClick={()=>{setAuthMode("signin");setAuthError("");}}>Sign in</button><button type="button" className={authMode === "signup" ? "button button-primary" : "button button-outline"} onClick={()=>{setAuthMode("signup");setAuthError("");}}>Create account</button></div>{authError && <div className="inline-message"><AlertCircle size={18}/><span>{authError}</span></div>}<form onSubmit={handleAuth}><label>Email address<input type="email" required autoComplete="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength={6} autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="button button-primary full" disabled={authBusy} type="submit">{authBusy ? "Please wait…" : authMode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={16}/></button></form></div>}<div className="panel"><h2>Need help?</h2><p className="muted">Contact your HealthReachCare support team for help with appointments, medicine orders or home care.</p><button className="button button-outline" onClick={()=>setNotice("Support contact details need to be configured by the HealthReachCare team.")}><MessageCircle size={17}/> Contact support</button></div></section>;

  return <div className="app-shell">
    <header className="topbar"><button className="mobile-menu" aria-label="Open home" onClick={()=>setPage("home")}><Menu/></button><button className="brand-button" onClick={()=>setPage("home")}><Brand/></button><div className="topbar-right"><span className="secure-label"><ShieldCheck size={15}/> Care you can trust</span><button className="icon-button notification-button" aria-label="Show notifications" onClick={()=>setShowNotifications(!showNotifications)}><Bell size={20}/>{notifications.some(n=>!n.read && !n.isRead) && <span className="unread-dot"/>}</button><button className="profile-button" onClick={()=>setPage("account")}><span className="profile-circle"><UserRound size={17}/></span><span>{user?.displayName?.split(" ")[0] || "Account"}</span></button></div>
    {showNotifications && <div className="notification-popover"><div className="popover-head"><strong>Notifications</strong><button onClick={()=>setShowNotifications(false)} aria-label="Close notifications"><X size={17}/></button></div>{notificationError ? <p className="muted small">{notificationError}</p> : notifications.length ? notifications.slice(0,5).map(n=><div className="popover-notice" key={n.id}><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p></div>) : <p className="muted small">No new notifications.</p>}<button className="text-button" onClick={()=>{setPage("activities");setShowNotifications(false);}}>View all activities <ArrowRight size={15}/></button></div>}
    </header>
    <main>{page === "home" ? renderHome() : page === "search" ? renderDoctorDirectory() : page === "activities" ? renderActivities() : page === "medicines" ? renderMedicines() : renderAccount()}</main>
    <footer className="site-footer"><Brand/><p>Better access. Healthier communities.</p><span>Healthcare information is not a substitute for professional medical advice.</span></footer>
    <nav className="bottom-nav" aria-label="Main navigation">{navItems.map(item=>{const Icon=item.icon;const active=(item.id==="search" && page==="search") || (item.id==="activities" && page==="activities") || (item.id==="account" && page==="account") || (item.id==="home" && ["home","medicines"].includes(page));return <button key={item.id} className={active?"nav-item active":"nav-item"} onClick={()=>setPage(item.id)}><Icon size={21}/><span>{item.label}</span></button>})}</nav>
    {formType && <div className="modal-backdrop" onClick={()=>setFormType("")}><section className="request-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">HEALTHREACHCARE REQUEST</div><h2>{formType==="appointment"?"Request an appointment":formType==="homecare"?"Request home care":"Prescription enquiry"}</h2></div><button className="icon-button" aria-label="Close" onClick={()=>setFormType("")}><X/></button></div><p className="muted">Enter your details to submit a request. You must be signed in and Firestore security rules must allow the request.</p><form onSubmit={submitForm}><label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Phone number<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="e.g. 082 123 4567"/></label><label>Town or suburb<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Where do you need care?"/></label><label>{formType==="prescription"?"Prescription details (do not include sensitive information here)":"How can we help?"}<textarea required value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Briefly describe what you need" rows={3}/></label><div className="inline-message"><ShieldCheck size={17}/><span>Do not use this form for emergencies or include sensitive medical records. Prescription file uploads are not enabled here.</span></div><button className="button button-primary full" type="submit">Review request <ArrowRight size={16}/></button></form></section></div>}
  </div>;
}

export default App;
