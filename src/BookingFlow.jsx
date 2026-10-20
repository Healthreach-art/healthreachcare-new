import { useEffect, useMemo, useState } from "react";
import {
  addDoc, collection, getDocs, query, serverTimestamp, where
} from "firebase/firestore";
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3,
  Heart, MapPin, ShieldCheck, Stethoscope, House, CreditCard, ClipboardCheck,
  UserRound, AlertCircle, RefreshCw
} from "lucide-react";
import { db } from "./firebase";
import "./BookingFlow.css";

const doctorModes = ["In-person", "Video", "Phone"];
const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "18:00"];
const services = [
  { id: "personal_care", title: "Personal care", description: "Daily living and personal support" },
  { id: "elderly_care", title: "Elderly care", description: "Companionship and everyday support" },
  { id: "post_surgery", title: "Post-surgery care", description: "Recovery support at home" },
  { id: "mobility", title: "Mobility assistance", description: "Safe movement and transfers" },
  { id: "medication_support", title: "Medication support", description: "Help following a prescribed medicine schedule" },
  { id: "specialised_care", title: "Specialised care", description: "Care needs requiring a suitable qualified provider" }
];

const localDate = () => {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};

const displayName = doctor => doctor.fullName || doctor.full_name || doctor.name || "Verified doctor";
const displaySpecialty = doctor => doctor.specialty || doctor.specialisation || "General practitioner";
const displayLocation = doctor => doctor.city || doctor.location || doctor.address || "Location not listed";
const feeLabel = doctor => Number.isFinite(Number(doctor.consultationFee ?? doctor.consultation_fee))
  ? "R" + Number(doctor.consultationFee ?? doctor.consultation_fee).toFixed(2)
  : "Fee confirmed by provider";

export default function BookingFlow({ type, onBack, user }) {
  const homecare = type === "homecare";
  const [step, setStep] = useState(0);
  const [doctors, setDoctors] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedService, setSelectedService] = useState(services[0]);
  const [consultation, setConsultation] = useState("In-person");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("2");
  const [address, setAddress] = useState("");
  const [name, setName] = useState(user?.displayName || "");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const minimumDate = localDate();

  const steps = homecare
    ? ["Service", "Visit details", "Review", "Request status"]
    : ["Choose doctor", "Consultation", "Schedule", "Review", "Request status"];
  const stepTitle = useMemo(() => homecare
    ? ["Choose home care", "Tell us about the visit", "Review your request", "Request status"][step]
    : ["Find a verified doctor", "Choose consultation type", "Schedule your appointment", "Review your request", "Request status"][step],
  [homecare, step]);

  useEffect(() => {
    let cancelled = false;
    async function loadProviders() {
      setLoading(true);
      setLoadError("");
      try {
        if (!db) throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* settings before using live booking.");
        if (homecare) {
          const snap = await getDocs(query(collection(db, "homecareProviders"), where("status", "==", "approved"), where("isVerified", "==", true)));
          if (!cancelled) setProviders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          const snap = await getDocs(query(collection(db, "doctors"), where("isActive", "==", true), where("isVerified", "==", true)));
          if (!cancelled) {
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setDoctors(rows);
            setSelectedDoctor(current => current || rows[0] || null);
          }
        }
      } catch (e) {
        if (!cancelled) setLoadError(e?.message || "We could not load approved providers. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadProviders();
    return () => { cancelled = true; };
  }, [homecare]);

  const matchingProviders = providers.filter(p => {
    const listed = Array.isArray(p.services) ? p.services : Array.isArray(p.serviceTypes) ? p.serviceTypes : [];
    return listed.some(s => String(typeof s === "string" ? s : s?.id || s?.name || "").toLowerCase()
      .replaceAll(" ", "_") === selectedService.id || String(typeof s === "string" ? s : s?.name || "").toLowerCase() === selectedService.title.toLowerCase());
  });
  const durationHours = Number(duration);
  const availableRates = matchingProviders.map(p => Number(p.hourlyRateZar ?? p.hourlyRate ?? p.hourly_rate)).filter(n => Number.isFinite(n) && n > 0);
  const lowestRate = availableRates.length ? Math.min(...availableRates) : null;
  const estimatedTotal = lowestRate == null || !Number.isFinite(durationHours) ? null : lowestRate * durationHours;

  const submitRequest = async () => {
    setError("");
    if (!user?.uid) { setError("Please sign in from Account before submitting a booking request."); return; }
    if (!db) { setError("Firebase is not configured. No request was sent."); return; }
    if (!name.trim() || !phone.trim() || !date || !time) { setError("Complete your name, phone number, preferred date and time."); return; }
    if (homecare && !address.trim()) { setError("Enter the full address where care is needed."); return; }
    if (!homecare && !selectedDoctor) { setError("There are no verified doctors available to select."); return; }
    setBusy(true);
    try {
      const common = {
        patientUid: user.uid,
        patientName: name.trim(),
        patientEmail: user.email || "",
        phone: phone.trim(),
        preferredAt: new Date(date + "T" + time + ":00").toISOString(),
        preferredDate: date,
        preferredTime: time,
        notes: notes.trim(),
        requestStatus: "pending",
        status: "pending",
        paymentStatus: "not_started",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      let ref;
      if (homecare) {
        ref = await addDoc(collection(db, "homecareRequests"), {
          ...common,
          serviceId: selectedService.id,
          service: selectedService.title,
          address: address.trim(),
          durationHours,
          providerUid: null,
          quotedHourlyRateZar: null,
          totalAmountZar: null,
          paymentNote: "Payment must only be collected through the configured secure checkout after the provider and amount are confirmed."
        });
      } else {
        ref = await addDoc(collection(db, "appointments"), {
          ...common,
          doctorId: selectedDoctor.id,
          doctorName: displayName(selectedDoctor),
          specialty: displaySpecialty(selectedDoctor),
          consultationMode: consultation,
          consultationFeeZar: Number.isFinite(Number(selectedDoctor.consultationFee ?? selectedDoctor.consultation_fee))
            ? Number(selectedDoctor.consultationFee ?? selectedDoctor.consultation_fee) : null
        });
      }
      setSaved({ id: ref.id, kind: homecare ? "homecare" : "appointment" });
      setStep(homecare ? 3 : 4);
    } catch (e) {
      setError(e?.code === "permission-denied"
        ? "Firebase security rules denied this request. No booking was confirmed; an administrator must configure patient-owned booking permissions."
        : e?.message || "We could not submit your request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const back = () => {
    setError("");
    if (step === 0) onBack();
    else setStep(current => Math.max(0, current - 1));
  };
  const iconFor = item => item.id === "medication_support" || item.id === "specialised_care"
    ? <ShieldCheck size={20}/> : item.id === "elderly_care" ? <Heart size={20}/> : <House size={20}/>;

  if (!user?.uid) return <section className="page-content booking-page">
    <button className="booking-back-link" onClick={onBack}><ArrowLeft size={16}/> Back to HealthReachCare</button>
    <div className="booking-main-card"><div className="booking-success-illustration"><UserRound size={36}/></div><h2>Sign in to continue</h2><p className="booking-muted">Bookings are linked to your account so you can follow provider responses. Open Account and sign in or create your account, then return here.</p><button className="button button-primary" onClick={onBack}>Back to sign in <ArrowRight size={16}/></button></div>
  </section>;

  return <section className="page-content booking-page">
    <button className="booking-back-link" onClick={back}><ArrowLeft size={16}/> {step === 0 ? "Back to HealthReachCare" : "Previous step"}</button>
    <div className="booking-heading">
      <div className="booking-heading-icon">{homecare ? <House size={25}/> : <Stethoscope size={25}/>}</div>
      <div><div className="eyebrow">{homecare ? "HOME CARE BOOKING" : "DOCTOR APPOINTMENT"}</div><h1>{stepTitle}</h1><p>{homecare ? "Request professional care at your address and track the provider response." : "Choose a verified practitioner and submit a request for their availability."}</p></div>
    </div>
    <div className="booking-progress" aria-label={`Step ${step + 1} of ${steps.length}`}>
      {steps.map((label, index) => <div key={label} className={index < step ? "booking-progress-step complete" : index === step ? "booking-progress-step current" : "booking-progress-step"}><span>{index < step ? <Check size={14}/> : index + 1}</span><small>{label}</small></div>)}
    </div>
    <div className="booking-test-banner"><ShieldCheck size={18}/><span><strong>Booking safety:</strong> only verified providers are listed. A request is not a confirmed appointment or paid homecare visit until provider acceptance, availability checks and secure payment verification are complete.</span></div>

    {loading && <div className="state-card"><RefreshCw className="spin" size={22}/><div><strong>Loading approved providers</strong><p>Checking live HealthReachCare records.</p></div></div>}
    {loadError && <div className="state-card state-error"><AlertCircle size={22}/><div><strong>Provider list unavailable</strong><p>{loadError}</p></div></div>}

    {!loading && !loadError && !homecare && step === 0 && <div className="booking-layout">
      <div className="booking-main-card"><div className="booking-section-title"><div><h2>Find your doctor</h2><p>Only active, verified practitioners are displayed.</p></div><span className="step-count">{doctors.length} verified</span></div>
        {doctors.length ? <div className="booking-choice-list">{doctors.map(d => <button key={d.id} className={selectedDoctor?.id === d.id ? "booking-doctor-row selected" : "booking-doctor-row"} onClick={() => setSelectedDoctor(d)}>
          <span className="booking-doctor-avatar">{displayName(d).split(" ").map(x=>x[0]).slice(0,2).join("")}</span><span className="booking-doctor-info"><strong>{displayName(d)}</strong><small>{displaySpecialty(d)}</small><small><MapPin size={13}/> {displayLocation(d)}</small></span><span className="booking-doctor-fee">{feeLabel(d)}<small>provider fee</small></span><span className="booking-radio">{selectedDoctor?.id === d.id && <Check size={13}/>}</span>
        </button>)}</div> : <div className="empty-state"><Stethoscope size={25}/><h3>No verified doctors are available yet</h3><p>Only providers approved and published by HealthReachCare can appear here. No sample profiles are shown.</p></div>}
      </div>
      <aside className="booking-side-card"><div className="booking-side-title"><ClipboardCheck size={19}/><strong>Your selection</strong></div>{selectedDoctor ? <><div className="booking-summary-doctor"><span className="booking-doctor-avatar">{displayName(selectedDoctor).split(" ").map(x=>x[0]).slice(0,2).join("")}</span><div><strong>{displayName(selectedDoctor)}</strong><small>{displaySpecialty(selectedDoctor)}</small></div></div><div className="booking-summary-line"><span>Consultation</span><strong>{consultation}</strong></div><div className="booking-summary-line"><span>Fee</span><strong>{feeLabel(selectedDoctor)}</strong></div><button className="button button-primary full" onClick={()=>setStep(1)}>Continue <ArrowRight size={16}/></button></> : <p className="booking-muted">Select a verified doctor to continue.</p>}</aside>
    </div>}

    {!loading && !loadError && !homecare && step === 1 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Consultation type</h2><p>Select a mode offered by the provider.</p></div></div><div className="booking-option-row">{doctorModes.map(mode=><button key={mode} className={consultation === mode ? "booking-option selected" : "booking-option"} onClick={()=>setConsultation(mode)}>{mode}</button>)}</div><p className="booking-muted">The provider must confirm the selected mode and appointment time.</p></div>}

    {!loading && !loadError && !homecare && step === 2 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Schedule your appointment</h2><p>Choose your preferred time. The provider must confirm availability.</p></div></div><div className="booking-form-grid"><label className="booking-field"><span>Preferred date</span><input type="date" min={minimumDate} value={date} onChange={e=>setDate(e.target.value)} required/></label><label className="booking-field"><span>Full name</span><input value={name} onChange={e=>setName(e.target.value)} required/></label><label className="booking-field"><span>Phone number</span><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 082 123 4567" required/></label></div><div className="booking-field"><span>Preferred time</span><div className="booking-time-grid">{times.map(t=><button key={t} className={time === t ? "booking-time selected" : "booking-time"} onClick={()=>setTime(t)}><Clock3 size={15}/>{t}</button>)}</div></div><label className="booking-field"><span>Reason for visit (optional)</span><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Brief non-sensitive booking note. Avoid sharing detailed medical records here."/></label></div>}

    {homecare && step === 0 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>What care do you need?</h2><p>Choose the service that best matches your needs.</p></div></div><div className="booking-service-grid">{services.map(s=><button key={s.id} className={selectedService.id === s.id ? "booking-service-card selected" : "booking-service-card"} onClick={()=>setSelectedService(s)}><span>{iconFor(s)}</span><strong>{s.title}</strong><small>{s.description}</small><span className="booking-select-label">{selectedService.id === s.id ? "Selected" : "Select service"}</span></button>)}</div></div>}

    {homecare && step === 1 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Tell us about the visit</h2><p>Share contact details and where care is needed.</p></div></div><div className="booking-form-grid"><label className="booking-field"><span>Full name</span><input value={name} onChange={e=>setName(e.target.value)} required/></label><label className="booking-field"><span>Phone number</span><input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="e.g. 082 123 4567" required/></label><label className="booking-field"><span>Care address</span><input value={address} onChange={e=>setAddress(e.target.value)} placeholder="Street, suburb, town" required/></label><label className="booking-field"><span>Preferred date</span><input type="date" min={minimumDate} value={date} onChange={e=>setDate(e.target.value)} required/></label><label className="booking-field"><span>Preferred time</span><select value={time} onChange={e=>setTime(e.target.value)}><option value="">Choose a time</option>{times.map(t=><option key={t} value={t}>{t}</option>)}</select></label><label className="booking-field"><span>Duration</span><select value={duration} onChange={e=>setDuration(e.target.value)}>{["1","2","4","8"].map(h=><option key={h} value={h}>{h} {h === "1" ? "hour" : "hours"}</option>)}</select></label></div><label className="booking-field"><span>Care instructions (optional)</span><textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Share practical care requirements. Avoid unnecessary sensitive medical details."/></label></div>}

    {!loading && !loadError && ((homecare && step === 2) || (!homecare && step === 3)) && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Review before submitting</h2><p>Your request will be sent to the booking system for provider review.</p></div></div><div className="booking-summary-table">{[[ "Patient", name ],["Service", homecare ? selectedService.title : displayName(selectedDoctor || {})],["Consultation", homecare ? `${durationHours} hours` : consultation],["Address", homecare ? address : displayLocation(selectedDoctor || {})],["Preferred date", date],["Preferred time", time],["Status", "Pending provider review"],["Payment", "Not collected"]].map(([label,value])=><div key={label} className="booking-summary-line"><span>{label}</span><strong>{value || "Not specified"}</strong></div>)}</div>{homecare && <div className="booking-payment-preview"><div className="booking-payment-icon"><CreditCard size={25}/></div><div><strong>{estimatedTotal == null ? "Price not available yet" : `Indicative rate: R${lowestRate.toFixed(2)}/hour · R${estimatedTotal.toFixed(2)} for ${durationHours} hours`}</strong><p>{estimatedTotal == null ? "We will not invent a price. An approved provider rate must be available before a payable total can be confirmed." : "This is an estimate from the lowest matching approved provider rate. The final amount must be confirmed by the trusted booking/payment service before checkout."}</p></div></div>}</div>}

    {!loading && !loadError && ((homecare && step === 3) || (!homecare && step === 4)) && <div className="booking-main-card"><div className="booking-success-illustration"><CheckCircle2 size={42}/></div><h2>Request submitted</h2><p className="booking-muted">Your request was saved to Firebase and is awaiting provider review. It is not yet confirmed and no payment has been collected.</p><div className="booking-summary-table">{[[ "Reference", saved?.id || "Available in your activity list" ],["Status", "Pending provider review"],["Payment", "Not collected"]].map(([label,value])=><div key={label} className="booking-summary-line"><span>{label}</span><strong>{value}</strong></div>)}</div><div className="booking-test-banner"><ShieldCheck size={18}/> A secure server-side availability reservation and payment verification are still required before the booking can be confirmed or paid.</div><div className="booking-timeline"><div className="active"><span>1</span><div><strong>Request received</strong><small>Saved to the booking collection</small></div></div><div><span>2</span><div><strong>Provider review and availability check</strong><small>Pending provider action</small></div></div><div><span>3</span><div><strong>Secure checkout and confirmation</strong><small>Only after the trusted payment service is connected</small></div></div></div></div>}

    {error && <p className="booking-validation-error">{error}</p>}
    <div className="booking-actions"><button className="button button-outline" onClick={back}><ArrowLeft size={16}/> {step === 0 ? "Cancel" : "Back"}</button>{((homecare && step < 2) || (!homecare && step < 3)) && <button className="button button-primary" disabled={loading || busy || (!homecare && doctors.length === 0)} onClick={()=>{setError(""); if (homecare && step === 1 && (!name.trim() || !phone.trim() || !address.trim() || !date || !time)) return setError("Enter your name, phone, address, date and time."); if (!homecare && step === 2 && (!name.trim() || !phone.trim() || !date || !time)) return setError("Enter your name, phone, preferred date and time."); setStep(current=>current+1);}}>{homecare && step === 1 ? "Review request" : !homecare && step === 2 ? "Review request" : "Continue"} <ArrowRight size={16}/></button>}{((homecare && step === 2) || (!homecare && step === 3)) && <button className="button button-primary" disabled={busy || loading} onClick={submitRequest}>{busy ? "Submitting…" : "Submit booking request"} <ArrowRight size={16}/></button>}{((homecare && step === 3) || (!homecare && step === 4)) && <button className="button button-primary" onClick={onBack}>Finish <Check size={16}/></button>}</div>
    {saved && <p className="booking-saved-note">Reference: <strong>{saved.id}</strong> · Request only, not a paid confirmation.</p>}
  </section>;
}
