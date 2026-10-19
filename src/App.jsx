import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { addDoc, collection, doc, onSnapshot, query, orderBy, limit, serverTimestamp, updateDoc, where } from "firebase/firestore";
import {
  Activity, ArrowRight, Bell, CalendarDays, CheckCircle2, ChevronRight, AlarmClock, Siren, Send,
  ClipboardList, Clock3, HeartPulse, Home, MapPin, Menu, Pill, Search,
  ShieldCheck, Stethoscope, Truck, UserRound, Users, Video, Phone, RefreshCw,
  Upload, House, MessageCircle, AlertCircle, X, ShoppingCart, Plus, Minus, Trash2
} from "lucide-react";
import { auth, db, firebaseConfigured } from "./firebase";
import ProviderVerification from "./ProviderVerification";

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
  const previousRequestStatuses = useRef(null);
  const [requestError, setRequestError] = useState("");
  const [notificationError, setNotificationError] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [medicineCatalog, setMedicineCatalog] = useState([]);
  const [medicineState, setMedicineState] = useState("loading");
  const [medicineError, setMedicineError] = useState("");
  const [cart, setCart] = useState([]);
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
  const [formConsent, setFormConsent] = useState(false);
  const [authMode, setAuthMode] = useState("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [workspaceRole, setWorkspaceRole] = useState("");
  const [workspaceStatus, setWorkspaceStatus] = useState("loading");
  const [workspaceError, setWorkspaceError] = useState("");
  const [assignedRequests, setAssignedRequests] = useState([]);
  const [savingRequestId, setSavingRequestId] = useState("");
  const [providerAccounts, setProviderAccounts] = useState([]);
  const [assignmentChoices, setAssignmentChoices] = useState({});
  const [reminders, setReminders] = useState([]);
  const [reminderLoadedFor, setReminderLoadedFor] = useState("");
  const [reminderForm, setReminderForm] = useState({title:"",person:"Me",when:"",repeatDaily:false});
  const [reminderMessage, setReminderMessage] = useState("");
  const [expandedRequestId, setExpandedRequestId] = useState("");
  const [chatRequestId, setChatRequestId] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [chatDraft, setChatDraft] = useState("");
  const [chatError, setChatError] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [supportForm, setSupportForm] = useState({topic:"Service request",reference:"",message:""});

  useEffect(() => {
    const owner = user?.uid || "guest";
    setReminderLoadedFor("");
    try {
      const saved = JSON.parse(window.localStorage.getItem("hrc-reminders-v1:" + owner) || "[]");
      setReminders(Array.isArray(saved) ? saved : []);
    } catch { setReminders([]); }
    setReminderLoadedFor(owner);
  }, [user?.uid]);

  useEffect(() => {
    const owner = user?.uid || "guest";
    if (reminderLoadedFor !== owner) return;
    try { window.localStorage.setItem("hrc-reminders-v1:" + owner, JSON.stringify(reminders)); } catch {}
  }, [reminders, user?.uid, reminderLoadedFor]);

  useEffect(() => {
    const checkReminders = () => {
      const now = Date.now();
      setReminders(current => {
        let changed = false;
        const next = current.map(item => {
          if (!item.enabled || !item.when || new Date(item.when).getTime() > now || (item.lastFiredAt && now - item.lastFiredAt < 55000)) return item;
          changed = true;
          try {
            if ("Notification" in window && Notification.permission === "granted") new Notification("HealthReachCare reminder", { body: item.title + (item.person ? " · " + item.person : ""), tag: "hrc-reminder-" + item.id });
            if ("vibrate" in navigator) navigator.vibrate([250, 120, 250]);
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
              const audioContext = new AudioContextClass();
              const oscillator = audioContext.createOscillator();
              const gain = audioContext.createGain();
              oscillator.type = "sine";
              oscillator.frequency.value = 880;
              gain.gain.value = 0.12;
              oscillator.connect(gain); gain.connect(audioContext.destination);
              oscillator.start(); oscillator.stop(audioContext.currentTime + 0.7);
              oscillator.onended = () => audioContext.close();
            }
            setReminderMessage("Reminder: " + item.title + (item.person ? " · " + item.person : ""));
          } catch {}
          if (item.repeatDaily) {
            const nextWhen = new Date(item.when);
            nextWhen.setDate(nextWhen.getDate() + 1);
            while (nextWhen.getTime() <= now) nextWhen.setDate(nextWhen.getDate() + 1);
            return { ...item, when: nextWhen.toISOString().slice(0,16), lastFiredAt: now };
          }
          return { ...item, enabled: false, lastFiredAt: now };
        });
        return changed ? next : current;
      });
    };
    checkReminders();
    const id = window.setInterval(checkReminders, 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!firebaseConfigured || !auth) return;
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!db) { setMedicineCatalog([]); setMedicineState("config"); return; }
    setMedicineState("loading");
    return onSnapshot(query(collection(db,"medicines"),where("publicCatalog","==",true),limit(100)), snapshot => {
      const rows=snapshot.docs.map(d=>({id:d.id,...d.data()})).filter(item=>item.active===true&&Number(item.stock??0)>0);
      rows.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||"")));
      setMedicineCatalog(rows); setMedicineState("ready"); setMedicineError("");
    }, error => {
      setMedicineState("error");
      setMedicineError(error?.code==="permission-denied"?"The public medicine catalogue is not readable under the current access rules.":"We could not load the medicine catalogue. Please try again.");
    });
  }, []);

  useEffect(() => {
    if (!db) {
      setDoctorState("config");
      setDoctorError("Doctor directory is not connected yet. Add the Firebase web configuration to enable live, verified practitioner records.");
      return;
    }
    setDoctorState("loading");
    setDoctorError("");
    const batches = new Map();
    const publish = () => {
      const merged = new Map();
      for (const rows of batches.values()) {
        for (const doctor of rows) merged.set(doctor.id, doctor);
      }
      setDoctors([...merged.values()]);
      setDoctorState("ready");
    };
    const specs = [
      ["verified", "verified", true],
      ["isVerified", "isVerified", true],
      ["verificationStatus", "verificationStatus", "verified"]
    ];
    const unsubscribers = specs.map(([key, field, value]) => onSnapshot(
      query(collection(db, "doctors"), where(field, "==", value), limit(100)),
      snapshot => {
        batches.set(key, snapshot.docs.map(d => ({ id:d.id, ...d.data() })));
        publish();
      },
      error => {
        setDoctorState("error");
        setDoctorError(error?.code === "permission-denied"
          ? "Your account cannot read the published doctor directory. Check the Firestore rules for verified practitioner records."
          : "We couldn’t load the doctor directory. Check your connection and Firebase configuration, then try again.");
      }
    ));
    return () => unsubscribers.forEach(unsubscribe => unsubscribe());
  }, []);

  useEffect(() => {
    if (!db || !user) {
      setWorkspaceRole("");
      setWorkspaceStatus(user ? "unavailable" : "signed-out");
      setWorkspaceError("");
      setAssignedRequests([]);
      return;
    }
    setWorkspaceStatus("loading");
    return onSnapshot(doc(db, "user_roles", user.uid), snapshot => {
      const data = snapshot.exists() ? snapshot.data() : {};
      const role = String(data.role || "").toLowerCase();
      const approved = role === "admin" || role === "super_admin"
        || data.verified === true || data.verificationStatus === "verified" || data.status === "approved";
      if (["doctor", "pharmacy", "homecare", "admin", "super_admin"].includes(role) && approved) {
        setWorkspaceRole(role);
        setWorkspaceStatus("ready");
        setWorkspaceError("");
      } else {
        setWorkspaceRole("");
        setWorkspaceStatus("unavailable");
        setWorkspaceError(role ? "Your provider account is not approved yet. Contact the HealthReachCare administrator." : "No approved provider role is linked to this account.");
      }
    }, () => {
      setWorkspaceRole("");
      setWorkspaceStatus("error");
      setWorkspaceError("We could not verify your workspace access. Check the user_roles security rules and try again.");
    });
  }, [user]);

  useEffect(() => {
    if (!db || !user || !workspaceRole || workspaceStatus !== "ready") {
      setAssignedRequests([]);
      return;
    }
    const requestsRef = collection(db, "serviceRequests");
    const requestsQuery = workspaceRole === "admin" || workspaceRole === "super_admin"
      ? query(requestsRef, limit(100))
      : query(requestsRef, where("assignedProviderId", "==", user.uid), limit(100));
    return onSnapshot(requestsQuery, snapshot => {
      const rows = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      rows.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setAssignedRequests(rows);
      setWorkspaceError("");
    }, error => {
      setWorkspaceError(error?.code === "permission-denied"
        ? "Your role cannot read these requests. Only administrators and explicitly assigned providers can access them."
        : "Workspace requests could not be loaded. Please try again.");
    });
  }, [user, workspaceRole, workspaceStatus]);

  useEffect(() => {
    if (!db || !user || !["admin", "super_admin"].includes(workspaceRole) || workspaceStatus !== "ready") {
      setProviderAccounts([]);
      return;
    }
    return onSnapshot(query(collection(db, "user_roles"), limit(100)), snapshot => {
      const approved = snapshot.docs.map(d => ({ uid: d.id, ...d.data() }))
        .filter(p => ["doctor", "pharmacy", "homecare"].includes(String(p.role || "").toLowerCase())
          && (p.verified === true || p.verificationStatus === "verified" || p.status === "approved"));
      setProviderAccounts(approved);
    }, () => setWorkspaceError("Approved provider accounts could not be loaded for assignment."));
  }, [user, workspaceRole, workspaceStatus]);

  const assignServiceRequest = async requestId => {
    if (!db || !["admin", "super_admin"].includes(workspaceRole)) return;
    const providerUid = assignmentChoices[requestId];
    const provider = providerAccounts.find(p => p.uid === providerUid);
    if (!provider) { setWorkspaceError("Choose an approved provider before assigning this request."); return; }
    setSavingRequestId(requestId); setWorkspaceError("");
    try {
      await updateDoc(doc(db, "serviceRequests", requestId), {
        assignedProviderId: provider.uid,
        assignedProviderRole: String(provider.role).toLowerCase(),
        assignedProviderName: provider.displayName || provider.name || "",
        assignedProviderBusinessName: provider.businessName || "",
        assignedProviderPhone: provider.phone || "",
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      setWorkspaceError(error?.code === "permission-denied" ? "The administrator role cannot assign this request under the current Firestore rules." : "Assignment was not saved. Please try again.");
    } finally { setSavingRequestId(""); }
  };
  const updateProviderRequest = async (requestId, status) => {
    if (!db || !user || !workspaceRole || !["accepted", "confirmed", "in_progress", "awaiting_patient", "preparing", "ready_for_pickup", "out_for_delivery", "completed", "rejected"].includes(status)) return;
    setSavingRequestId(requestId);
    setWorkspaceError("");
    try {
      await updateDoc(doc(db, "serviceRequests", requestId), { status, updatedAt: serverTimestamp() });
    } catch (error) {
      setWorkspaceError(error?.code === "permission-denied"
        ? "This request is not assigned to your account or your role cannot update it."
        : "The request status was not saved. Check your connection and try again.");
    } finally {
      setSavingRequestId("");
    }
  };

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
      previousRequestStatuses.current = null;
      setRequestError("");
      return;
    }
    const requestQuery = query(collection(db, "serviceRequests"), where("patientUid", "==", user.uid), limit(30));
    return onSnapshot(requestQuery, snapshot => {
      const rows = snapshot.docs.map(d => ({ id:d.id, ...d.data() }));
      rows.sort((a,b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      const nextStatuses = Object.fromEntries(rows.map(item=>[item.id,item.status||"pending"]));
      const previous = previousRequestStatuses.current;
      if (previous && "Notification" in window && Notification.permission === "granted") {
        rows.forEach(item => {
          const status = item.status || "pending";
          if (previous[item.id] && previous[item.id] !== status) {
            try {
              new Notification("HealthReachCare service update", {body:"Your service status has changed to " + status.replaceAll("_"," ") + ".", tag:"hrc-service-"+item.id});
              if ("vibrate" in navigator) navigator.vibrate([180,80,180]);
              const AudioContextClass = window.AudioContext || window.webkitAudioContext;
              if (AudioContextClass) {
                const ctx = new AudioContextClass(); const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
                oscillator.frequency.value = 740; gain.gain.value = 0.08; oscillator.connect(gain); gain.connect(ctx.destination);
                oscillator.start(); oscillator.stop(ctx.currentTime+0.35); oscillator.onended=()=>ctx.close();
              }
            } catch {}
          }
        });
      }
      previousRequestStatuses.current = nextStatuses;
      setServiceRequests(rows);
      setRequestError("");
    }, error => {
      setRequestError(error?.code === "permission-denied"
        ? "Your account cannot read request history. Check the serviceRequests Firestore rules."
        : "Your request history is temporarily unavailable. Please try again later.");
    });
  }, [user]);

  useEffect(() => {
    if (!db || !user || !chatRequestId) { setChatMessages([]); return; }
    const request = [...serviceRequests, ...assignedRequests].find(item => item.id === chatRequestId);
    const allowed = request && request.assignedProviderId && ["accepted","confirmed","in_progress","preparing","ready_for_pickup","out_for_delivery","awaiting_patient"].includes(request.status);
    if (!allowed) { setChatMessages([]); setChatError("Messaging is available only while your assigned service is in progress."); return; }
    const participantField = ["doctor","pharmacy","homecare"].includes(workspaceRole) ? "providerUid" : "patientUid";
    return onSnapshot(query(collection(db,"serviceRequestMessages"),where("requestId","==",chatRequestId),where(participantField,"==",user.uid),limit(100)), snapshot => {
      const rows = snapshot.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0));
      setChatMessages(rows); setChatError("");
    }, error => setChatError(error?.code==="permission-denied" ? "This conversation is restricted to you and your assigned provider while the service is active." : "Messages could not be loaded."));
  }, [user, chatRequestId, serviceRequests, assignedRequests, workspaceRole]);

  const sendChatMessage = async event => {
    event.preventDefault();
    const request = [...serviceRequests, ...assignedRequests].find(item=>item.id===chatRequestId);
    if(!db||!user||!request||!request.assignedProviderId||!["accepted","confirmed","in_progress","preparing","ready_for_pickup","out_for_delivery","awaiting_patient"].includes(request.status)||!chatDraft.trim()) return;
    setChatSending(true); setChatError("");
    try {
      await addDoc(collection(db,"serviceRequestMessages"), {requestId:request.id,patientUid:request.patientUid,providerUid:request.assignedProviderId,senderUid:user.uid,text:chatDraft.trim().slice(0,2000),createdAt:serverTimestamp()});
      setChatDraft("");
    } catch { setChatError("Message was not sent. Please try again."); }
    finally { setChatSending(false); }
  };

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
    const orderDetails = type==="medicine" && cart.length ? cart.map(item=>item.name+" × "+item.quantity+" — R"+(Number(item.price||0)*item.quantity).toFixed(2)).join("\n") : "";
    setForm({name:user?.displayName || "",phone:"",details:orderDetails,location:""});
    setFormConsent(false);
  };

  const addMedicineToCart = medicine => {
    if (!medicine.pharmacyId || !medicine.name || !Number.isFinite(Number(medicine.price)) || Number(medicine.price)<0) {
      setNotice("This item is not available to order yet. Please choose an item with a confirmed pharmacy and price."); return;
    }
    if (cart.length && cart[0].pharmacyId !== medicine.pharmacyId) {
      setNotice("Please complete or clear your current pharmacy order before adding items from another pharmacy."); return;
    }
    setCart(current=>{
      const existing=current.find(item=>item.id===medicine.id);
      if(existing)return current.map(item=>item.id===medicine.id?{...item,quantity:Math.min(item.quantity+1,Math.max(1,Number(medicine.stock||1)))}:item);
      return [...current,{id:medicine.id,name:String(medicine.name),description:String(medicine.description||""),price:Number(medicine.price),stock:Number(medicine.stock||0),requiresPrescription:medicine.requiresPrescription===true,pharmacyId:medicine.pharmacyId,pharmacyName:medicine.pharmacyName||"",quantity:1}];
    });
    setNotice(String(medicine.requiresPrescription===true?"Prescription required: the pharmacy will verify your prescription before dispensing. ":"")+"Added to your cart.");
  };

  const cartTotal = cart.reduce((sum,item)=>sum+item.price*item.quantity,0);
  const updateCartQuantity = (id,quantity) => setCart(current=>current.map(item=>item.id===id?{...item,quantity:Math.max(1,Math.min(Number(quantity)||1,item.stock||1))}:item));

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
      if (!formConsent) { setNotice("Please confirm that you have read the privacy notice and agree to share the information needed to handle this request."); return; }
      const serviceType = formType === "appointment" ? "appointment" : formType === "homecare" ? "homecare" : formType === "medicine" ? "medicine" : "prescription";
      if (serviceType === "medicine" && cart.length === 0) { setNotice("Add at least one medicine from the catalogue before submitting an order."); return; }
      await addDoc(collection(db, "serviceRequests"), {
        serviceType, status: "pending", patientUid: user.uid,
        patientName: form.name.trim() || user.displayName || "",
        patientEmail: user.email || "", phone: form.phone.trim(),
        location: form.location.trim(), details: form.details.trim(),
        ...(serviceType==="medicine" && cart.length ? {
          pharmacyId: cart[0].pharmacyId, pharmacyName: cart[0].pharmacyName,
          items: cart.map(item=>({medicineId:item.id,name:item.name,quantity:item.quantity,unitPrice:item.price,requiresPrescription:item.requiresPrescription})),
          orderAmount: Number(cartTotal.toFixed(2)), currency:"ZAR", orderStage:"awaiting_pharmacy_confirmation"
        } : {}),
        privacyNoticeVersion: "2026-10-20-v1", consentAt: serverTimestamp(),
        createdAt: serverTimestamp(), updatedAt: serverTimestamp()
      });
      setFormType("");
      if(serviceType==="medicine" && cart.length) setCart([]);
      setForm({name:user.displayName || "",phone:"",details:"",location:""});
      setNotice(serviceType==="medicine" ? "Your order request was received. The pharmacy must confirm stock, prescription requirements and the final price before fulfilment or payment." : "Your request was received. Track its status and provider updates in Activities.");
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

  const trackingStages = request => {
    if (request.serviceType === "medicine" || request.serviceType === "prescription") return [
      ["pending","Order received"],["accepted","Pharmacy confirmed"],["preparing","Preparing medication"],["ready_for_pickup","Ready for collection"],["out_for_delivery","With delivery driver"],["completed","Delivered"]
    ];
    if (request.serviceType === "homecare") return [["pending","Request received"],["accepted","Provider accepted"],["confirmed","Visit scheduled"],["in_progress","Care in progress"],["completed","Visit completed"]];
    return [["pending","Request received"],["accepted","Provider accepted"],["confirmed","Appointment confirmed"],["awaiting_patient","Awaiting patient"],["completed","Appointment completed"]];
  };
  const trackingIndex = request => {
    const stages = trackingStages(request);
    if (request.status === "rejected" || request.status === "cancelled") return -1;
    return Math.max(0, stages.findIndex(stage=>stage[0]===request.status));
  };
  const activePatientRequests = serviceRequests.filter(r=>!["completed","rejected","cancelled"].includes(r.status||"pending"));

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
    {user && activePatientRequests.length>0 && <><div className="section-heading compact"><div><div className="eyebrow">LIVE CARE JOURNEY</div><h2>Track your active services</h2></div><button className="text-button" onClick={()=>setPage("activities")}>Full details <ArrowRight size={15}/></button></div><div className="home-tracking-list">{activePatientRequests.slice(0,3).map(r=>{const stages=trackingStages(r);const index=trackingIndex(r);return <button type="button" className="home-track-card" key={r.id} onClick={()=>{setExpandedRequestId(r.id);setPage("activities");}}><div className="home-track-head"><strong>{({medicine:"Medication order",prescription:"Prescription request",appointment:"Doctor appointment",homecare:"Homecare visit"})[r.serviceType]||"Healthcare service"}</strong><span>{String(r.status||"pending").replaceAll("_"," ")}</span></div><div className="mini-progress">{stages.map((stage,i)=><span key={stage[0]} className={i<=index?"done":""} title={stage[1]}/>)}</div><p>{index>=0?stages[index][1]:String(r.status).replaceAll("_"," ")} · Open Activities for full details</p></button>})}</div></>}
    <div className="section-heading compact"><div><div className="eyebrow">PERSONAL HEALTH TOOLS</div><h2>Reminders & emergency help</h2></div></div>
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><AlarmClock/></div><div><h2>My reminders</h2><p>Medication times, appointments or care tasks for you or someone you care for.</p></div></div>
      {reminderMessage&&<div className="inline-message"><AlarmClock size={17}/><span>{reminderMessage}</span><button className="text-button" onClick={()=>setReminderMessage("")}>Dismiss</button></div>}
      <form className="reminder-form" onSubmit={async e=>{e.preventDefault();if(!reminderForm.title.trim()||!reminderForm.when)return; if("Notification" in window && Notification.permission==="default"){try{await Notification.requestPermission();}catch{}} const item={id:crypto.randomUUID(),title:reminderForm.title.trim(),person:reminderForm.person,when:reminderForm.when,repeatDaily:reminderForm.repeatDaily,enabled:true};setReminders(prev=>[...prev,item].sort((a,b)=>new Date(a.when)-new Date(b.when)));setReminderForm({title:"",person:"Me",when:"",repeatDaily:false});setReminderMessage("Reminder saved on this device. Keep HealthReachCare open for the in-app alarm; background alerts depend on browser permissions and support.");}}>
        <label>What should we remind you about?<input required maxLength={120} value={reminderForm.title} onChange={e=>setReminderForm({...reminderForm,title:e.target.value})} placeholder="e.g. Take morning medication"/></label>
        <div className="filter-row"><label>For<select value={reminderForm.person} onChange={e=>setReminderForm({...reminderForm,person:e.target.value})}><option>Me</option><option>My child</option><option>Parent or older relative</option><option>Someone I care for</option></select></label><label>Date and time<input type="datetime-local" required min={new Date().toISOString().slice(0,16)} value={reminderForm.when} onChange={e=>setReminderForm({...reminderForm,when:e.target.value})}/></label></div>
        <label className="reminder-check"><input type="checkbox" checked={reminderForm.repeatDaily} onChange={e=>setReminderForm({...reminderForm,repeatDaily:e.target.checked})}/> Repeat daily</label>
        <button className="button button-primary" type="submit">Save reminder <AlarmClock size={16}/></button>
      </form>
      {reminders.length>0&&<div className="reminder-list">{reminders.map(item=><div className="notification-item" key={item.id}><span className="notification-dot"/><div className="reminder-copy"><strong>{item.title}</strong><p>For {item.person} · {new Date(item.when).toLocaleString()} {item.repeatDaily?"· Daily":""}</p><p>{item.enabled?"Reminder enabled":"Reminder completed or paused"}</p></div><button className="text-button" onClick={()=>setReminders(prev=>prev.filter(r=>r.id!==item.id))}>Remove</button></div>)}</div>}
      <p className="muted small">Reminders are stored in this browser on this device and are not synced across devices. Do not rely on this feature as your only medication safety system.</p>
    </div>
    <div className="panel emergency-panel"><div className="panel-heading"><div className="panel-icon emergency-icon"><Siren/></div><div><h2>Emergency help</h2><p>If someone may be in immediate danger, call emergency services directly.</p></div></div><div className="emergency-actions"><a className="button button-primary" href="tel:112"><Phone size={17}/> Call 112 (mobile emergency)</a><a className="button button-outline" href="tel:10177"><Phone size={17}/> Ambulance 10177</a></div><p className="muted small">HealthReachCare is not an emergency dispatch service. Do not wait for an in-app reply during an emergency.</p></div>
    <div className="section-heading compact"><div><div className="eyebrow">YOUR CARE JOURNEY</div><h2>Care you can count on</h2></div></div>
    <div className="trust-grid"><div><ShieldCheck/><strong>Verified professionals</strong><p>Practitioner listings are filtered for verification.</p></div><div><Clock3/><strong>Convenient access</strong><p>Explore care services from one place.</p></div><div><HeartPulse/><strong>Care around you</strong><p>Designed for patients and communities across South Africa.</p></div></div>
  </section>;

  const renderActivities = () => <section className="page-content">
    <div className="eyebrow">YOUR HEALTH JOURNEY</div><h1>Activities</h1><p className="lead">Track appointments, medication orders and homecare visits, and contact your assigned provider while the service is active.</p>
    {!user&&<div className="inline-message"><AlertCircle size={18}/><span>Sign in to see requests linked to your account.</span><button className="text-button" onClick={()=>setPage("account")}>Sign in <ArrowRight size={14}/></button></div>}
    {requestError&&<div className="inline-message"><AlertCircle size={18}/><span>{requestError}</span></div>}
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><ClipboardList/></div><div><h2>Your service history</h2><p>Open any service to view its status, details, provider and map links.</p></div></div>
      {!user?<p className="muted">Sign in to see your service history.</p>:serviceRequests.length===0?<div className="empty-state"><ClipboardList size={26}/><h3>Your care journey will appear here</h3><p>Your submitted appointments, medicine orders and homecare requests are listed here.</p><button className="button button-primary" onClick={()=>setPage("home")}>Explore services</button></div>:serviceRequests.map(r=>{
        const stages=trackingStages(r);const idx=trackingIndex(r);const isOpen=expandedRequestId===r.id;
        const active=!!r.assignedProviderId&&["accepted","confirmed","in_progress","awaiting_patient","preparing","ready_for_pickup","out_for_delivery"].includes(r.status);
        return <article className="activity-card" key={r.id}>
          <button type="button" className="activity-card-toggle" onClick={()=>setExpandedRequestId(isOpen?"":r.id)}>
            <span className="activity-type-icon">{r.serviceType==="medicine"?<Pill/>:r.serviceType==="appointment"?<Stethoscope/>:r.serviceType==="homecare"?<House/>:<ClipboardList/>}</span>
            <span className="activity-main"><strong>{({appointment:"Doctor appointment",homecare:"Homecare service",prescription:"Prescription request",medicine:"Medication order"})[r.serviceType]||"Healthcare service"}</strong><small>{r.createdAt?.toDate?r.createdAt.toDate().toLocaleString():"Submitted request"}</small><span className="activity-status">{String(r.status||"pending").replaceAll("_"," ")}</span></span>
            <ChevronRight className={isOpen?"rotate-chevron":""}/>
          </button>
          <div className="mini-progress">{stages.map((stage,i)=><span key={stage[0]} className={idx>=i?"done":""} title={stage[1]}/>)}</div>
          {isOpen&&<div className="activity-detail">
            <div className="tracking-timeline">{stages.map((stage,i)=><div className={idx>=i?"timeline-step reached":"timeline-step"} key={stage[0]}><span className="timeline-dot"/><div><strong>{stage[1]}</strong>{i===idx&&<small>Current stage</small>}</div></div>)}{["rejected","cancelled"].includes(r.status)&&<div className="inline-message"><AlertCircle size={17}/><span>This request is {r.status}. Contact support if you need help with next steps.</span></div>}</div>
            <div className="detail-grid"><div><small>Request reference</small><strong>{r.id}</strong></div><div><small>Patient / recipient</small><strong>{r.patientName||user?.displayName||"Account holder"}</strong></div><div><small>Service location</small><strong>{r.location||"Not supplied"}</strong></div><div><small>Contact number</small><strong>{r.phone||"Not supplied"}</strong></div></div>
            {r.details&&<div className="request-description"><small>Request details</small><p>{r.details}</p></div>}
            {Array.isArray(r.items)&&r.items.length>0&&<div className="request-description"><small>Medication order items</small>{r.items.map((item,index)=><div className="order-detail-line" key={item.medicineId||index}><span>{item.name} × {item.quantity}{item.requiresPrescription?" · Prescription required":""}</span><strong>R{(Number(item.unitPrice||0)*Number(item.quantity||0)).toFixed(2)}</strong></div>)}<div className="order-detail-total"><span>Indicative subtotal · {r.currency||"ZAR"}</span><strong>R{Number(r.orderAmount||0).toFixed(2)}</strong></div><p className="muted small">Final price and availability are confirmed by the pharmacy.</p></div>}
            {r.assignedProviderId&&<div className="provider-contact-card"><div className="panel-icon"><ShieldCheck/></div><div><strong>{r.assignedProviderBusinessName||r.assignedProviderName||({medicine:"Assigned pharmacy",prescription:"Assigned pharmacy",appointment:"Assigned practitioner",homecare:"Assigned homecare provider"})[r.serviceType]||"Assigned provider"}</strong><p>{r.assignedProviderPhone||"Contact is available through the active service conversation."}</p><p className="muted small">Provider reference: {r.assignedProviderId.slice(0,8)}</p></div></div>}
            {r.location&&<div className="map-panel"><div className="activity-map"><iframe title={r.driverLatitude!=null&&r.driverLongitude!=null?"Live delivery location map":"Service location map"} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={"https://maps.google.com/maps?q="+encodeURIComponent(r.driverLatitude!=null&&r.driverLongitude!=null?String(r.driverLatitude)+","+String(r.driverLongitude):r.location)+"&output=embed"}/><div className="map-caption"><strong>{r.driverLatitude!=null&&r.driverLongitude!=null?"Latest driver location":"Service destination"}</strong><span>{r.driverLatitude!=null&&r.driverLongitude!=null?"Location supplied by the delivery workflow":"Open the map to view the service address"}</span><a href={"https://www.google.com/maps/search/?api=1&query="+encodeURIComponent(r.driverLatitude!=null&&r.driverLongitude!=null?String(r.driverLatitude)+","+String(r.driverLongitude):r.location)} target="_blank" rel="noreferrer">Open in Maps <ArrowRight size={15}/></a></div></div></div>}
            {active&&r.assignedProviderId&&<div className="conversation-panel"><div className="panel-heading"><div className="panel-icon"><MessageCircle/></div><div><h3>Conversation with your provider</h3><p>Available while the assigned service is active. It closes when the service is completed or cancelled.</p></div></div>
              {chatRequestId===r.id&&chatError&&<div className="inline-message"><AlertCircle size={17}/><span>{chatError}</span></div>}
              {chatRequestId===r.id&&<div className="chat-messages">{chatMessages.length?chatMessages.map(m=><div key={m.id} className={m.senderUid===user?.uid?"chat-bubble mine":"chat-bubble"}><p>{m.text}</p><small>{m.createdAt?.toDate?m.createdAt.toDate().toLocaleString():"Sending…"}</small></div>):<p className="muted small">No messages yet. Send a message to the assigned provider.</p>}</div>}
              {chatRequestId!==r.id?<button className="button button-outline" onClick={()=>{setChatRequestId(r.id);setChatError("");}}>Open conversation <MessageCircle size={16}/></button>:<form className="chat-form" onSubmit={sendChatMessage}><input aria-label="Message to provider" maxLength={2000} value={chatDraft} onChange={e=>setChatDraft(e.target.value)} placeholder="Write a message…" required/><button className="button button-primary" disabled={chatSending||!chatDraft.trim()}><Send size={16}/>{chatSending?"Sending…":"Send"}</button></form>}
            </div>}
            {!active&&<p className="muted small">This service is no longer active, so provider messaging is closed. You can still review the service details above.</p>}
          </div>}
        </article>;
      })}
    </div>
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><Bell/></div><div><h2>Notifications</h2><p>Updates from your HealthReachCare account</p></div></div>{notificationError?<div className="inline-message"><AlertCircle size={18}/><span>{notificationError}</span></div>:notifications.length?notifications.map(n=><div className="notification-item" key={n.id}><span className="notification-dot"/><div><strong>{n.title||n.subject||"HealthReachCare update"}</strong><p>{n.message||n.body||"You have a new update."}</p>{n.createdAt?.toDate&&<small>{n.createdAt.toDate().toLocaleString()}</small>}</div></div>):<div className="empty-state"><Bell size={26}/><h3>You're all caught up</h3><p>Service updates will appear here when the connected workflow sends them.</p></div>}</div>
  </section>;

  const renderMedicines = () => <section className="page-content"><div className="eyebrow">PHARMACY SERVICES</div><h1>Order medication</h1><p className="lead">Browse participating pharmacy items, build one pharmacy order and track its progress in Activities.</p>
    {notice&&<div className="notice"><AlertCircle size={18}/><span>{notice}</span><button aria-label="Dismiss message" onClick={()=>setNotice("")}><X size={17}/></button></div>}
    <div className="panel"><div className="panel-heading"><div className="panel-icon blue"><Pill/></div><div><h2>Available medicines</h2><p>Products and prices are supplied by participating pharmacies.</p></div></div>
      {medicineState==="loading"&&<div className="state-card"><RefreshCw className="spin" size={22}/><div><strong>Loading pharmacy catalogue</strong><p>Checking current catalogue availability.</p></div></div>}
      {medicineState==="config"&&<div className="empty-state"><Pill size={28}/><h3>Find medication from participating pharmacies</h3><p>Search and order from pharmacies that publish their current catalogue.</p></div>}
      {medicineState==="error"&&<div className="inline-message"><AlertCircle size={18}/><span>{medicineError}</span></div>}
      {medicineState==="ready"&&medicineCatalog.length===0&&<div className="empty-state"><Pill size={28}/><h3>No medicines available to order right now</h3><p>Please check again later or submit a prescription enquiry.</p><button className="button button-outline" onClick={()=>openForm("prescription")}>Prescription enquiry</button></div>}
      {medicineCatalog.length>0&&<div className="medicine-grid">{medicineCatalog.map(item=><article className="medicine-card" key={item.id}><div className="medicine-icon"><Pill size={24}/></div><h3>{item.name||"Medicine"}</h3><p>{item.description||"Supplied by a participating pharmacy."}</p><p className="medicine-pharmacy">{item.pharmacyName||"Participating pharmacy"}</p><strong className="medicine-price">R{Number(item.price||0).toFixed(2)}</strong>{item.requiresPrescription===true&&<span className="prescription-badge">Prescription required</span>}<small>{Number(item.stock||0)} available</small><button className="button button-primary full" disabled={!item.pharmacyId||Number(item.stock||0)<1} onClick={()=>addMedicineToCart(item)}><Plus size={16}/> Add to cart</button></article>)}</div>}
      <p className="muted small">Catalogue prices and stock must be confirmed by the pharmacy before an order is accepted. Prescription medicines require appropriate prescription verification before dispensing.</p>
    </div>
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><ShoppingCart/></div><div><h2>Your cart {cart.length>0&&"("+cart.reduce((n,item)=>n+item.quantity,0)+")"}</h2><p>{cart.length?cart[0].pharmacyName||"One pharmacy per order":"Add medicines from a pharmacy to begin an order."}</p></div></div>
      {!cart.length?<div className="empty-state"><ShoppingCart size={25}/><h3>Your cart is ready</h3><p>Choose an item from the catalogue above to start your order.</p></div>:<>
        <div className="cart-items">{cart.map(item=><div className="cart-line" key={item.id}><div className="cart-product"><strong>{item.name}</strong><small>{item.requiresPrescription?"Prescription required":"Pharmacy verification required"}</small><span>R{item.price.toFixed(2)} each</span></div><div className="quantity-control"><button aria-label={"Decrease "+item.name} onClick={()=>item.quantity<=1?setCart(prev=>prev.filter(row=>row.id!==item.id)):updateCartQuantity(item.id,item.quantity-1)}><Minus size={14}/></button><strong>{item.quantity}</strong><button aria-label={"Increase "+item.name} disabled={item.quantity>=item.stock} onClick={()=>updateCartQuantity(item.id,item.quantity+1)}><Plus size={14}/></button><button className="remove-cart-item" aria-label={"Remove "+item.name} onClick={()=>setCart(prev=>prev.filter(row=>row.id!==item.id))}><Trash2 size={15}/></button></div><strong className="cart-line-total">R{(item.price*item.quantity).toFixed(2)}</strong></div>)}</div>
        <div className="cart-total"><span>Catalogue subtotal (indicative)</span><strong>R{cartTotal.toFixed(2)}</strong></div><p className="muted small">Delivery fees, final price and stock will be confirmed by the pharmacy. No payment is taken from this request screen.</p><button className="button button-primary full" onClick={()=>openForm("medicine")}>Continue to order details <ArrowRight size={16}/></button><button className="button button-outline full" onClick={()=>setCart([])}>Clear cart</button>
      </>}
    </div>
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><Upload/></div><div><h2>Prescription enquiry</h2><p>Ask a participating pharmacy to review your prescription needs.</p></div></div><button className="button button-outline" onClick={()=>openForm("prescription")}>Submit prescription enquiry <ArrowRight size={16}/></button></div>
  </section>;

  const providerStatusActionsFor = request => {
    const status = request.status || "pending";
    const pharmacy = {
      pending: [{status:"accepted",label:"Confirm order"},{status:"rejected",label:"Reject"}],
      accepted: [{status:"preparing",label:"Start preparing"},{status:"rejected",label:"Reject"}],
      preparing: [{status:"ready_for_pickup",label:"Ready for pickup"},{status:"out_for_delivery",label:"Out for delivery"}],
      ready_for_pickup: [{status:"completed",label:"Collected"},{status:"out_for_delivery",label:"Out for delivery"}],
      out_for_delivery: [{status:"completed",label:"Delivered"}]
    };
    const doctor = {
      pending: [{status:"accepted",label:"Accept appointment"},{status:"confirmed",label:"Confirm appointment"},{status:"rejected",label:"Decline"}],
      accepted: [{status:"confirmed",label:"Confirm appointment"},{status:"rejected",label:"Decline"}],
      confirmed: [{status:"awaiting_patient",label:"Awaiting patient"},{status:"completed",label:"Complete"},{status:"rejected",label:"Decline"}],
      awaiting_patient: [{status:"confirmed",label:"Resume appointment"},{status:"completed",label:"Complete"}]
    };
    const homecare = {
      pending: [{status:"accepted",label:"Accept request"},{status:"rejected",label:"Decline"}],
      accepted: [{status:"confirmed",label:"Schedule visit"},{status:"in_progress",label:"Start visit"},{status:"rejected",label:"Decline"}],
      confirmed: [{status:"in_progress",label:"Start visit"},{status:"rejected",label:"Decline"}],
      in_progress: [{status:"completed",label:"Complete visit"}]
    };
    return (workspaceRole === "pharmacy" ? pharmacy : workspaceRole === "homecare" ? homecare : doctor)[status] || [];
  };

  const renderWorkspace = () => <section className="page-content">
    <div className="eyebrow">PROVIDER OPERATIONS</div><h1>{workspaceRole === "doctor" ? "Doctor workspace" : workspaceRole === "pharmacy" ? "Pharmacy workspace" : workspaceRole === "homecare" ? "Homecare workspace" : "Administration workspace"}</h1>
    <p className="lead">Live service requests assigned to your approved account. Patient data is limited by the Firestore rules.</p>
    {workspaceStatus === "loading" && <div className="state-card"><RefreshCw className="spin" size={22}/><div><strong>Checking workspace access</strong><p>Verifying your role and approval status.</p></div></div>}
    {(workspaceStatus === "signed-out" || workspaceStatus === "unavailable" || workspaceStatus === "error") && <div className="inline-message"><ShieldCheck size={18}/><span>{workspaceStatus === "signed-out" ? "Sign in with your provider account to access this workspace." : workspaceError || "Workspace access is not available."}</span><button className="text-button" onClick={()=>setPage("account")}>Open account <ArrowRight size={14}/></button></div>}
    {workspaceStatus === "ready" && <><div className="trust-grid"><div><ClipboardList/><strong>{assignedRequests.length} requests</strong><p>Requests visible to this role</p></div><div><Clock3/><strong>{assignedRequests.filter(r=>["pending","accepted","confirmed","in_progress"].includes(r.status)).length} active</strong><p>Awaiting completion</p></div><div><ShieldCheck/><strong>Approved role</strong><p>Access verified from user_roles</p></div></div>
      {workspaceError && <div className="inline-message"><AlertCircle size={18}/><span>{workspaceError}</span></div>}
      <div className="panel"><div className="panel-heading"><div className="panel-icon"><ClipboardList/></div><div><h2>{workspaceRole === "admin" || workspaceRole === "super_admin" ? "All service requests" : "Assigned service requests"}</h2><p>{workspaceRole === "pharmacy" ? "Review medicine and prescription requests" : workspaceRole === "homecare" ? "Coordinate homecare requests" : workspaceRole === "doctor" ? "Manage appointment requests" : "Review requests; assignment must be completed by an authorised admin workflow"}</p></div></div>
      {assignedRequests.length === 0 ? <div className="empty-state"><ClipboardList size={26}/><h3>No requests available</h3><p>Providers see requests only after an administrator assigns them. This workspace does not invent sample records.</p></div> : assignedRequests.map(r=><article className="notification-item" key={r.id}><span className="notification-dot"/><div style={{width:"100%"}}><strong>{({appointment:"Doctor appointment",homecare:"Homecare request",prescription:"Prescription enquiry",medicine:"Medicine order"})[r.serviceType] || "Healthcare request"}</strong><p>Status: {String(r.status || "pending").replaceAll("_"," ")} · {r.patientName || "Patient"}</p><p className="muted small">{r.location || "Location not provided"}{r.phone ? " · "+r.phone : ""}</p><p>{r.details || "No additional details."}</p>{Array.isArray(r.items)&&r.items.length>0&&<div className="request-description"><small>Requested items · indicative only</small>{r.items.map((item,index)=><div className="order-detail-line" key={item.medicineId||index}><span>{item.name} × {item.quantity}{item.requiresPrescription?" · Rx required":""}</span><strong>R{(Number(item.unitPrice||0)*Number(item.quantity||0)).toFixed(2)}</strong></div>)}<p className="muted small">Verify stock, prescription validity and final price before accepting.</p></div>}{workspaceRole !== "admin" && workspaceRole !== "super_admin" && <div className="filter-row">{providerStatusActionsFor(r).map(action=><button key={action.status} className={["completed","rejected"].includes(action.status)?"button button-primary":"button button-outline"} disabled={savingRequestId===r.id || r.status===action.status} onClick={()=>updateProviderRequest(r.id,action.status)}>{savingRequestId===r.id ? "Saving…" : action.label}</button>)}</div>}{["admin", "super_admin"].includes(workspaceRole) && <div className="filter-row"><label><span>Assign to approved provider</span><select value={assignmentChoices[r.id] || ""} onChange={e=>setAssignmentChoices(prev=>({...prev,[r.id]:e.target.value}))}><option value="">Choose provider…</option>{providerAccounts.filter(p=>r.serviceType==="appointment" ? p.role==="doctor" : r.serviceType==="homecare" ? p.role==="homecare" : r.serviceType==="medicine" || r.serviceType==="prescription" ? p.role==="pharmacy" : true).map(p=><option key={p.uid} value={p.uid}>{p.displayName || p.businessName || p.name || p.uid.slice(0,8)} · {p.role}</option>)}</select></label><button className="button button-primary" disabled={savingRequestId===r.id || !assignmentChoices[r.id]} onClick={()=>assignServiceRequest(r.id)}>{savingRequestId===r.id ? "Assigning…" : "Assign request"}</button></div>}</div>{workspaceRole!=="admin"&&workspaceRole!=="super_admin"&&r.assignedProviderId&&["accepted","confirmed","in_progress","awaiting_patient","preparing","ready_for_pickup","out_for_delivery"].includes(r.status)&&<div className="conversation-panel"><div className="panel-heading"><div className="panel-icon"><MessageCircle/></div><div><h3>Patient conversation</h3><p>Messages close when this service is completed.</p></div></div>{chatRequestId===r.id&&chatError&&<div className="inline-message"><AlertCircle size={17}/><span>{chatError}</span></div>}{chatRequestId===r.id&&<div className="chat-messages">{chatMessages.map(m=><div key={m.id} className={m.senderUid===user?.uid?"chat-bubble mine":"chat-bubble"}><p>{m.text}</p><small>{m.createdAt?.toDate?m.createdAt.toDate().toLocaleString():"Sending…"}</small></div>)}</div>}{chatRequestId!==r.id?<button className="button button-outline" onClick={()=>{setChatRequestId(r.id);setChatError("");}}>Open patient conversation <MessageCircle size={16}/></button>:<form className="chat-form" onSubmit={sendChatMessage}><input aria-label="Reply to patient" maxLength={2000} value={chatDraft} onChange={e=>setChatDraft(e.target.value)} placeholder="Reply to patient…" required/><button className="button button-primary" disabled={chatSending||!chatDraft.trim()}><Send size={16}/>{chatSending?"Sending…":"Send"}</button></form>}</div>}</article>)}</div>
    </>}
  </section>;

  const enableBrowserNotifications = async () => {
    if (!("Notification" in window)) { setNotice("This browser does not support desktop notifications. You can still see updates inside Activities."); return; }
    try {
      const permission = await Notification.requestPermission();
      setNotice(permission === "granted" ? "Browser alerts are enabled for service updates while HealthReachCare is running." : "Notifications were not enabled. You can still check service updates in Activities.");
    } catch { setNotice("Browser notifications could not be enabled on this device."); }
  };

  const renderAccount = () => <section className="page-content"><div className="eyebrow">YOUR ACCOUNT</div><h1>Account</h1><p className="lead">Your personal HealthReachCare space.</p><div className="panel account-panel"><div className="account-avatar"><UserRound size={28}/></div><div><h2>{user?.displayName || "Welcome to HealthReachCare"}</h2><p className="muted">{user?.email || "Sign in to submit and track your healthcare requests."}</p></div><span className="account-status"><span className={user ? "status-dot" : "status-dot status-muted"}/>{user ? "Signed in" : "Guest"}</span></div>{user ? <div className="panel"><h2>You’re signed in</h2><p className="muted">Requests you submit are linked to this account. Approved providers see requests only after assignment.</p><div className="filter-row"><button className="button button-outline" onClick={enableBrowserNotifications}><Bell size={17}/> Enable service alerts</button><button className="button button-outline" onClick={async()=>{await signOut(auth);setNotice("You have signed out.");}}><UserRound size={17}/> Sign out</button></div></div> : <div className="panel"><div className="panel-heading"><div className="panel-icon"><ShieldCheck/></div><div><h2>{authMode === "signup" ? "Create your account" : "Sign in"}</h2><p>Use your email to securely submit healthcare requests.</p></div></div><div className="filter-row"><button type="button" className={authMode === "signin" ? "button button-primary" : "button button-outline"} onClick={()=>{setAuthMode("signin");setAuthError("");}}>Sign in</button><button type="button" className={authMode === "signup" ? "button button-primary" : "button button-outline"} onClick={()=>{setAuthMode("signup");setAuthError("");}}>Create account</button></div>{authError && <div className="inline-message"><AlertCircle size={18}/><span>{authError}</span></div>}<form onSubmit={handleAuth}><label>Email address<input type="email" required autoComplete="email" value={authEmail} onChange={e=>setAuthEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength={6} autoComplete={authMode === "signup" ? "new-password" : "current-password"} value={authPassword} onChange={e=>setAuthPassword(e.target.value)} placeholder="At least 6 characters"/></label><button className="button button-primary full" disabled={authBusy} type="submit">{authBusy ? "Please wait…" : authMode === "signup" ? "Create account" : "Sign in"} <ArrowRight size={16}/></button></form></div>}<ProviderVerification user={user} workspaceRole={workspaceRole}/><div className="panel"><div className="panel-heading"><div className="panel-icon"><MessageCircle/></div><div><h2>Help & Support</h2><p>Get help with a service, account, safety concern or payment.</p></div></div><button className="button button-primary full" onClick={()=>setPage("support")}>Contact support <ArrowRight size={16}/></button></div><div className="panel"><div className="panel-heading"><div className="panel-icon"><ShieldCheck/></div><div><h2>Privacy, policies & patient rights</h2><p>Understand your information, service and safety choices.</p></div></div><div className="account-link-list"><button onClick={()=>setPage("privacy")}>Privacy notice <ChevronRight/></button><button onClick={()=>setPage("terms")}>Terms of service <ChevronRight/></button><button onClick={()=>setPage("cancellations")}>Cancellations & refunds <ChevronRight/></button><button onClick={()=>setPage("rights")}>Patient rights & safety <ChevronRight/></button></div></div></section>;

  const renderLegalPage = () => {
    const title = page === "privacy" ? "Privacy notice" : page === "terms" ? "Terms of service" : page === "cancellations" ? "Cancellations and refunds" : page === "support" ? "Help and support" : "Patient rights and safety";
    return <section className="page-content legal-page"><button className="text-button" onClick={()=>setPage("account")}>← Back to Account</button><div className="eyebrow">HEALTHREACHCARE CUSTOMER CENTRE</div><h1>{title}</h1>
      {page === "privacy" && <><p className="lead">How HealthReachCare handles account, service and health-related information.</p><div className="panel"><h2>Information and purpose</h2><p>We use the details you submit to create and manage your account, route your request to the relevant authorised provider, communicate about your service, maintain security, and handle support or disputes. Health information is particularly sensitive and must be handled confidentially under South African law.</p><h2>Sharing and access</h2><p>Only share information needed for the service. A request may be shared with the provider assigned to it and authorised staff who need it to fulfil the service. Providers must use information only for legitimate care and service purposes. Public practitioner profiles must not contain private patient information.</p><h2>Your choices and rights</h2><p>You may request access to or correction of personal information, ask questions about how it is used, and raise a privacy concern. Applicable rights and exceptions are governed by POPIA and other relevant law. Security, retention, deletion and access requests require a verified operational process.</p><h2>Security and incidents</h2><p>HealthReachCare should apply appropriate technical and organisational safeguards, limit staff access, review access logs, and follow applicable breach response and notification duties. Do not send passwords, payment credentials or emergency medical details by ordinary email.</p><h2>Contact</h2><p>For a privacy request, use the Support section. The responsible party's registered details and Information Officer contact must be supplied by HealthReachCare before this notice is used as the final production notice.</p><p className="muted small">Notice version: 2026-10-20-v1. You can contact Support with questions about your information.</p></div></>}
      {page === "terms" && <><p className="lead">Rules for using the platform to request healthcare-related services.</p><div className="panel"><h2>Platform role</h2><p>HealthReachCare helps patients discover participating providers and manage service requests. It does not itself replace a registered healthcare professional, pharmacist, emergency service or clinical assessment. Service availability, clinical decisions and dispensing remain subject to provider review and applicable law.</p><h2>Accurate information and consent</h2><p>Provide accurate contact and service details and only submit information you are authorised to share for yourself or another person. Do not use the platform for emergencies or submit another person's sensitive information without appropriate authority.</p><h2>Provider and service confirmation</h2><p>A submitted request is not a confirmed appointment, accepted prescription, guaranteed medicine stock, delivery time or confirmed homecare visit until the responsible provider accepts it and the platform records that status.</p><h2>Payments and records</h2><p>Only pay through an enabled, verified payment flow. Keep your receipt and reference. Do not send card PINs, passwords or banking credentials through messages. Prices, fees, cancellation rights and refunds must be disclosed before payment.</p><h2>Safety and misuse</h2><p>Do not misuse the platform, impersonate another person, attempt to access other users' records, or use provider messaging for abusive or unlawful purposes. HealthReachCare may investigate reports and restrict access where lawful and necessary.</p></div></>}
      {page === "cancellations" && <><p className="lead">Understand service status, cancellation requests and payment disputes.</p><div className="panel"><h2>Before a provider accepts</h2><p>You may contact Support to request cancellation of a pending request. A cancellation is complete only when the service record confirms it.</p><h2>After acceptance or preparation</h2><p>Cancellation depends on the type and stage of service, applicable law, provider terms and any disclosed costs. Prescription medicines and prepared orders may have special legal and safety restrictions. Do not assume a refund is automatic.</p><h2>Refunds and disputes</h2><p>Keep the service reference and payment receipt. Support should investigate duplicate charges, failed payments, unfulfilled services and refund requests. A payment is not treated as refunded until the payment provider confirms the refund.</p><h2>How to request help</h2><p>Open Account → Help & Support and include the request reference, date and a short description. Never include full card details or passwords.</p></div></>}
      {page === "support" && <><p className="lead">Get help with an appointment, medicine order, homecare visit, account or payment.</p><div className="panel"><h2>Contact support</h2><p>Include your service reference, what happened and how you would like us to help. Do not include passwords, card credentials or unnecessary medical details.</p><form className="support-form" onSubmit={e=>{e.preventDefault();const email=import.meta.env.VITE_SUPPORT_EMAIL;if(!email){setNotice("Support email address must be configured for this deployment.");setPage("account");return;}const body="Topic: "+supportForm.topic+"\nService reference: "+supportForm.reference+"\nAccount email: "+(user?.email||"Not signed in")+"\n\nMessage:\n"+supportForm.message;window.location.href="mailto:"+email+"?subject="+encodeURIComponent("HealthReachCare support: "+supportForm.topic)+"&body="+encodeURIComponent(body);}}><label>What do you need help with?<select value={supportForm.topic} onChange={e=>setSupportForm({...supportForm,topic:e.target.value})}><option>Service request</option><option>Medication order</option><option>Appointment</option><option>Homecare</option><option>Payment or refund</option><option>Account access</option><option>Privacy concern</option><option>Safety concern</option><option>Complaint or feedback</option></select></label><label>Service reference (if applicable)<input value={supportForm.reference} onChange={e=>setSupportForm({...supportForm,reference:e.target.value})} placeholder="Reference shown in Activities"/></label><label>Message<textarea required rows={5} maxLength={4000} value={supportForm.message} onChange={e=>setSupportForm({...supportForm,message:e.target.value})} placeholder="Describe how we can help"/></label><button className="button button-primary full" type="submit"><MessageCircle size={17}/> Prepare email to support</button><p className="muted small">This opens your email application with the details you entered. Avoid including sensitive medical records, passwords or payment credentials.</p></form><h2>Urgent help</h2><p>For a medical emergency in South Africa, call 112 or 10177 for an ambulance. Do not wait for a response from support.</p><div className="emergency-actions"><a className="button button-primary" href="tel:112"><Phone size={17}/> Call 112</a><a className="button button-outline" href="tel:10177"><Phone size={17}/> Ambulance 10177</a></div></div></>}
      {page === "rights" && <><p className="lead">Your privacy, safety and dignity matter.</p><div className="panel"><h2>Patient information</h2><p>South African law protects the confidentiality of health information. Access should be limited to authorised people with a legitimate service or care purpose.</p><h2>Before a service</h2><p>Check the provider's identity and verification status, the service details, the expected price and cancellation terms. Ask the provider questions before accepting treatment or a medicine.</p><h2>Medication safety</h2><p>Use medicines only as directed by an appropriately authorised healthcare professional. Prescription medicines must be handled by authorised pharmacies under applicable rules. Do not rely on a delivery status as clinical advice.</p><h2>Emergency safety</h2><p>HealthReachCare is not an ambulance dispatcher. In South Africa, call 112 from a mobile phone or 10177 for an ambulance in an emergency.</p><p>Official references: <a href="https://www.gov.za/documents/protection-personal-information-act" target="_blank" rel="noreferrer">POPIA</a>, <a href="https://www.health.gov.za/wp-content/uploads/2022/05/NHREC-NHA-of-2003.pdf" target="_blank" rel="noreferrer">National Health Act</a>, <a href="https://www.sapc.za.org/Legislation_Rules" target="_blank" rel="noreferrer">South African Pharmacy Council legislation and rules</a>.</p></div></>}
    </section>;
  };

  return <div className="app-shell">
    <header className="topbar"><button className="mobile-menu" aria-label="Open home" onClick={()=>setPage("home")}><Menu/></button><button className="brand-button" onClick={()=>setPage("home")}><Brand/></button><div className="topbar-right"><span className="secure-label"><ShieldCheck size={15}/> Care you can trust</span><button className="icon-button notification-button" aria-label="Show notifications" onClick={()=>setShowNotifications(!showNotifications)}><Bell size={20}/>{notifications.some(n=>!n.read && !n.isRead) && <span className="unread-dot"/>}</button>{workspaceRole && <button className="button button-outline" onClick={()=>setPage("workspace")}>Workspace</button>}<button className="profile-button" onClick={()=>setPage("account")}><span className="profile-circle"><UserRound size={17}/></span><span>{user?.displayName?.split(" ")[0] || "Account"}</span></button></div>
    {showNotifications && <div className="notification-popover"><div className="popover-head"><strong>Notifications</strong><button onClick={()=>setShowNotifications(false)} aria-label="Close notifications"><X size={17}/></button></div>{notificationError ? <p className="muted small">{notificationError}</p> : notifications.length ? notifications.slice(0,5).map(n=><div className="popover-notice" key={n.id}><strong>{n.title || n.subject || "HealthReachCare update"}</strong><p>{n.message || n.body || "You have a new update."}</p></div>) : <p className="muted small">No new notifications.</p>}<button className="text-button" onClick={()=>{setPage("activities");setShowNotifications(false);}}>View all activities <ArrowRight size={15}/></button></div>}
    </header>
    <main>{page === "home" ? renderHome() : page === "search" ? renderDoctorDirectory() : page === "activities" ? renderActivities() : page === "medicines" ? renderMedicines() : page === "workspace" ? renderWorkspace() : ["privacy","terms","cancellations","support","rights"].includes(page) ? renderLegalPage() : renderAccount()}</main>
    <footer className="site-footer"><Brand/><p>Better access. Healthier communities.</p><span>Healthcare information is not a substitute for professional medical advice.</span></footer>
    <nav className="bottom-nav" aria-label="Main navigation">{navItems.map(item=>{const Icon=item.icon;const active=(item.id==="search" && page==="search") || (item.id==="activities" && page==="activities") || (item.id==="account" && page==="account") || (item.id==="home" && ["home","medicines"].includes(page));return <button key={item.id} className={active?"nav-item active":"nav-item"} onClick={()=>setPage(item.id)}><Icon size={21}/><span>{item.label}</span></button>})}</nav>
    {formType && <div className="modal-backdrop" onClick={()=>setFormType("")}><section className="request-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">HEALTHREACHCARE REQUEST</div><h2>{formType==="appointment"?"Request an appointment":formType==="homecare"?"Request home care":formType==="medicine"?"Medicine order request":"Prescription enquiry"}</h2></div><button className="icon-button" aria-label="Close" onClick={()=>setFormType("")}><X/></button></div><p className="muted">Enter your details to submit a request. You must be signed in and Firestore security rules must allow the request.</p><form onSubmit={submitForm}><label>Full name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Your name"/></label><label>Phone number<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="e.g. 082 123 4567"/></label><label>Town or suburb<input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="Where do you need care?"/></label><label>{formType==="prescription"?"Prescription details (do not include sensitive information here)":formType==="medicine"?"Medicine name or order details (a pharmacy must confirm availability and price)":"How can we help?"}<textarea required value={form.details} onChange={e=>setForm({...form,details:e.target.value})} placeholder="Briefly describe what you need" rows={3}/></label><label className="consent-check"><input type="checkbox" checked={formConsent} onChange={e=>setFormConsent(e.target.checked)} required/><span>I confirm I am authorised to submit this request and have read the <button type="button" className="inline-link" onClick={()=>{setFormType("");setPage("privacy");}}>Privacy Notice</button>. I agree that the information entered may be shared with the provider assigned to deliver this service.</span></label><div className="inline-message"><ShieldCheck size={17}/><span>Do not use this form for emergencies. Share only information necessary to arrange care. Prescription files must be handled through an approved secure channel.</span></div><button className="button button-primary full" type="submit">Submit request <ArrowRight size={16}/></button></form></section></div>}
  </div>;
}

export default App;
