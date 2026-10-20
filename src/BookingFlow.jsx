import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Heart, House, ShieldCheck, Stethoscope, AlertCircle, Accessibility, HandHeart, Pill, Sparkles, MapPin } from "lucide-react";
import { saveTestBooking, SIMULATION_CONFIG } from "./test-workflow.js";
import "./BookingFlow.css";
const services = [
  { id: "personal_care", title: "Personal care", description: "Daily living and personal support" },
  { id: "elderly_care", title: "Elderly care", description: "Companionship and everyday support" },
  { id: "post_surgery", title: "Post-surgery care", description: "Recovery support at home" },
  { id: "mobility", title: "Mobility assistance", description: "Safe movement and transfers" },
  { id: "medication_support", title: "Medication support", description: "Help following a prescribed medicine schedule" },
  { id: "specialised_care", title: "Specialised care", description: "Care requiring a suitably qualified provider" }
];
const demoDoctors = [
  { id: "demo-doctor-provider", name: "Dr. A. Mokoena", specialty: "General practitioner", location: "Illustrative clinic · Johannesburg", consultationFee: 350 },
  { id: "demo-doctor-provider-2", name: "Dr. L. Naidoo", specialty: "Family medicine", location: "Illustrative clinic · Cape Town", consultationFee: 420 },
  { id: "demo-doctor-provider-3", name: "Dr. T. Dlamini", specialty: "Primary care", location: "Illustrative clinic · Durban", consultationFee: 300 }
];

const doctorServices = [
  { id: "general", title: "General consultation", description: "For a new health concern or feeling unwell", subs: ["General health concern", "Fever or flu-like symptoms", "Pain or discomfort", "Minor illness or injury", "Not sure — help me choose"] },
  { id: "followup", title: "Follow-up consultation", description: "Review after a previous visit or treatment", subs: ["Review a previous consultation", "Discuss test results", "Follow-up after treatment", "Referral or care-plan follow-up"] },
  { id: "chronic", title: "Chronic condition review", description: "Ongoing health and medication review", subs: ["Blood pressure review", "Diabetes review", "Asthma or breathing review", "Long-term condition check-in"] },
  { id: "womens", title: "Women's health", description: "General women's health consultation", subs: ["General women's health", "Menstrual health concern", "Family planning discussion", "Pregnancy-related question"] },
  { id: "child", title: "Child health", description: "General health concerns for a child", subs: ["General child health", "Fever or common illness", "Growth and development concern", "Child follow-up visit"] },
  { id: "skin", title: "Skin, ear or eye concern", description: "Discuss common skin or sensory concerns", subs: ["Skin concern or rash", "Ear concern", "Eye concern", "Allergy-related concern"] },
  { id: "mental", title: "Mental wellbeing", description: "Discuss emotional wellbeing with a suitable professional", subs: ["Stress or anxiety", "Low mood", "Sleep concern", "Request a suitable referral"] }
];
const doctorSkills = {
  "demo-doctor-provider": ["general", "followup", "chronic", "womens", "child", "skin"],
  "demo-doctor-provider-2": ["general", "followup", "chronic", "womens", "mental"],
  "demo-doctor-provider-3": ["general", "followup", "chronic", "child", "skin"]
};

const modes = ["In-person", "Video", "Phone"];
const times = ["08:00", "09:00", "10:00", "11:00", "12:00", "14:00", "16:00", "18:00"];
export default function BookingFlow({ type, user, onBack, onOpenActivities }) {
  const homecare = type === "homecare";
  const [step, setStep] = useState(0);
  const [service, setService] = useState(services[0]);
  const [doctor, setDoctor] = useState(demoDoctors[0]);
  const [doctorService, setDoctorService] = useState(doctorServices[0]);
  const [doctorSubservice, setDoctorSubservice] = useState(doctorServices[0].subs[0]);
  const [patientArea, setPatientArea] = useState("");
  const [healthConcern, setHealthConcern] = useState("");
  const [mode, setMode] = useState("In-person");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("2");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState(null);
  const dateMin = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const detailsStep = homecare ? 1 : 2;
  const reviewStep = homecare ? 2 : 3;
  const confirmationStep = homecare ? 3 : 4;
  const providerMatches = demoDoctors.filter(item => (doctorSkills[item.id] || []).includes(doctorService.id));
  const serviceHourlyRate = SIMULATION_CONFIG.homecareHourlyRates[service.id] || 0;
  const quotedServicePrice = homecare ? serviceHourlyRate * Number(duration || 0) : Number(doctor.consultationFee || 0);
  const areaMatches = patientArea.trim() ? providerMatches.filter(item => item.location.toLowerCase().includes(patientArea.trim().toLowerCase())) : [];
  const visibleDoctors = areaMatches.length ? areaMatches : providerMatches;
  const next = () => {
    setMessage("");
    if (!homecare && step === 0 && !doctorService) { setMessage("Choose the type of consultation you need."); return; }
    if (!homecare && step === 1 && !doctor) { setMessage("Choose a suitable test doctor to continue."); return; }
    if (step === detailsStep && (!name.trim() || !phone.trim() || !date || date < dateMin || !time || (homecare && address.trim().length < 5))) {
      setMessage(homecare && address.trim().length < 5 ? "Enter a complete care address." : "Complete the required details and choose a valid future date."); return;
    }
    setStep(current => Math.min(reviewStep, current + 1));
  };
  const submit = () => {
    setMessage("");
    try {
      const item = saveTestBooking({
        kind: homecare ? "homecare" : "appointment",
        type: homecare ? "homecare" : "appointment",
        providerId: homecare ? "demo-homecare-provider" : doctor.id,
        providerName: homecare ? "Central homecare coordination (sandbox)" : doctor.name,
        patientName: name.trim(),
        patientPhone: phone.trim(),
        patientUid: "local-sandbox-patient",
        location: homecare ? address.trim() : patientArea.trim() || "Area not provided",
        address: homecare ? address.trim() : "",
        serviceType: homecare ? service.title : doctorService.title + (doctorSubservice ? " — " + doctorSubservice : ""),
        service: homecare ? service.title : doctorService.title + (doctorSubservice ? " — " + doctorSubservice : ""),
        consultationCategory: homecare ? "" : doctorService.title,
        consultationSubservice: homecare ? "" : doctorSubservice,
        patientArea: homecare ? "" : patientArea.trim(),
        healthConcern: homecare ? "" : healthConcern.trim(),
        consultationMode: homecare ? "In-person" : mode,
        doctorId: homecare ? "" : doctor.id,
        doctorName: homecare ? "" : doctor.name,
        consultationFee: homecare ? 0 : quotedServicePrice,
        servicePrice: quotedServicePrice,
        pricingUnit: homecare ? "ZAR per selected visit duration" : "ZAR per consultation",
        duration: homecare ? Number(duration) : 0,
        requestedDate: date,
        requestedTime: time,
        date,
        time,
        details: notes.trim(),
        paymentProvider: SIMULATION_CONFIG.paymentAdapter
      });
      setSubmittedRequest(item);
      setMessage("");
      setStep(confirmationStep);
    } catch (error) {
      setMessage(error.message || "Could not save the request. Check browser storage and try again.");
    }
  };
  return <section className="page-content booking-page">
    <button className="booking-back-link" onClick={step === 0 ? onBack : () => { setStep(current => current - 1); setMessage(""); }}><ArrowLeft size={16}/> {step === 0 ? "Back to HealthReachCare" : "Previous step"}</button>
    <div className="booking-heading"><div className="booking-heading-icon">{homecare ? <House size={25}/> : <Stethoscope size={25}/>}</div><div><div className="eyebrow">{homecare ? "HOMECARE REQUEST" : "DOCTOR APPOINTMENT"}</div><h1>{homecare ? (step === 0 ? "Choose homecare" : step === detailsStep ? "Visit details" : step === confirmationStep ? "Request received" : "Review your request") : (step === 0 ? "Choose a consultation" : step === 1 ? "Find a suitable doctor" : step === detailsStep ? "Visit details" : step === confirmationStep ? "Request received" : "Review your appointment")}</h1><p>{homecare ? "Choose a care service, preferred visit time and review the quoted price. Payment is simulated after provider acceptance." : "Choose the service first, then find a suitable provider for your needs."}</p></div></div>
    <div className="booking-test-banner compact-test-banner"><ShieldCheck size={17}/><span><strong>Sandbox simulation.</strong> Requests are saved locally and processed through simulated provider and payment workflows.</span></div>
    {homecare && step === 0 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>What care do you need?</h2><p>Select one service to continue.</p></div></div><div className="booking-service-grid">{services.map(s=>{const Icon=s.id==="personal_care"?HandHeart:s.id==="elderly_care"?Heart:s.id==="post_surgery"?ShieldCheck:s.id==="mobility"?Accessibility:s.id==="medication_support"?Pill:Sparkles;return <button type="button" key={s.id} className={service.id === s.id ? "booking-service-card selected" : "booking-service-card"} aria-pressed={service.id===s.id} onClick={() => setService(s)}><span className="booking-service-icon"><Icon size={22}/></span><strong>{s.title}</strong><small>{s.description}</small><span className="booking-select-label">{service.id === s.id ? <><CheckCircle2 size={14}/> Selected</> : "Select service"}</span></button>})}</div></div>}
    {!homecare && step === 0 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>What do you need help with?</h2><p>Choose a service first. You can describe your concern without choosing a diagnosis.</p></div></div><div className="booking-service-grid">{doctorServices.map(s=><button type="button" key={s.id} className={doctorService.id === s.id ? "booking-service-card selected" : "booking-service-card"} aria-pressed={doctorService.id===s.id} onClick={() => {setDoctorService(s);setDoctorSubservice(s.subs[0]);setDoctor(demoDoctors.find(item => (doctorSkills[item.id]||[]).includes(s.id)) || demoDoctors[0]);}}><span className="booking-service-icon"><Stethoscope size={21}/></span><strong>{s.title}</strong><small>{s.description}</small><span className="booking-select-label">{doctorService.id === s.id ? <><CheckCircle2 size={14}/> Selected</> : "Choose service"}</span></button>)}</div><label className="booking-field"><span>More specifically</span><select value={doctorSubservice} onChange={e=>setDoctorSubservice(e.target.value)}>{doctorService.subs.map(item=><option key={item} value={item}>{item}</option>)}</select></label><label className="booking-field"><span>Tell us what you need (optional)</span><textarea rows={3} maxLength={500} value={healthConcern} onChange={e=>setHealthConcern(e.target.value)} placeholder="Briefly describe what you would like help with. Avoid urgent emergencies and unnecessary sensitive details."/></label><div className="booking-test-banner"><ShieldCheck size={17}/><span>These are service categories, not diagnoses. A qualified clinician will assess your concern.</span></div></div>}
    {!homecare && step === 1 && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Available sandbox practitioners</h2><p>Providers should match your selected service and location. Sandbox practitioner profiles are used for this journey. Live credentials, availability and distance matching will be supplied by the provider directory.</p></div></div><label className="booking-field"><span>Your suburb or town</span><div className="booking-search-box"><MapPin size={17}/><input value={patientArea} onChange={e=>setPatientArea(e.target.value)} placeholder="Enter suburb, town or city" aria-label="Your suburb or town"/></div><small>This area will be attached to your test request. Real nearby matching requires the provider directory and location service.</small></label><div className="booking-service-grid booking-provider-grid">{visibleDoctors.map(d=><button type="button" key={d.id} className={doctor.id === d.id ? "booking-service-card selected" : "booking-service-card"} onClick={() => setDoctor(d)}><span className="booking-service-icon"><Stethoscope size={21}/></span><strong>{d.name}</strong><small>{d.specialty}</small><small>{d.location}</small><small>Consultation fee: R{d.consultationFee.toFixed(2)}</small><span className="booking-select-label">{doctor.id === d.id ? <><CheckCircle2 size={14}/> Selected</> : "Select doctor"}</span></button>)}</div><div className="booking-field"><span>Consultation format</span><div className="booking-option-row">{modes.map(m=><button type="button" key={m} className={mode === m ? "booking-option selected" : "booking-option"} onClick={() => setMode(m)}>{m}</button>)}</div></div></div>}
    {step === detailsStep && <div className="booking-main-card"><div className="booking-section-title"><div><h2>{homecare ? "Tell us about the visit" : "Your preferred appointment"}</h2><p>Fill in the required details.</p></div></div><div className="booking-form-grid">
      <label className="booking-field"><span>Full name</span><input value={name} onChange={e => setName(e.target.value)} autoComplete="name" required/></label>
      <label className="booking-field"><span>Phone number</span><input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="e.g. 082 123 4567" required/></label>
      {homecare && <label className="booking-field"><span>Care address</span><input value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, suburb, town" required/></label>}
      <label className="booking-field"><span>Preferred date</span><input type="date" min={dateMin} value={date} onChange={e => setDate(e.target.value)} required/></label>
      <label className="booking-field"><span>Preferred time</span><select value={time} onChange={e => setTime(e.target.value)} required><option value="">Choose a time</option>{times.map(t => <option key={t} value={t}>{t}</option>)}</select></label>
      {homecare && <label className="booking-field"><span>Duration</span><select value={duration} onChange={e => setDuration(e.target.value)}>{["1","2","4","8"].map(h => <option key={h} value={h}>{h} {h === "1" ? "hour" : "hours"}</option>)}</select></label>}
    </div>{!homecare && <div className="booking-field"><span>Consultation type</span><div className="booking-option-row">{modes.map(m => <button key={m} className={mode === m ? "booking-option selected" : "booking-option"} onClick={() => setMode(m)}>{m}</button>)}</div></div>}<label className="booking-field"><span>Additional notes (optional)</span><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Avoid detailed medical information in this preview."/></label></div>}
    {step === reviewStep && <div className="booking-main-card"><div className="booking-section-title"><div><h2>Check your details</h2><p>Check your details before sending.</p></div></div><div className="booking-summary-table">{[["Patient",name],["Service",homecare ? service.title : doctorService.title + " — " + doctorSubservice],["Consultation",homecare ? duration + " hours" : mode],["Address / area",homecare ? address : patientArea || "Not provided"],["Preferred date",date],["Preferred time",time],["Request status","Waiting for provider review"],["Test provider",homecare ? "Demo Homecare Provider" : doctor.name],["What you need help with",homecare ? "Not applicable" : (healthConcern || "No additional details provided")],["Service price",homecare ? "Fixed price not configured in preview" : "R" + doctor.consultationFee.toFixed(2)],["Pricing",homecare ? "Fixed price not configured in this preview" : "Illustrative consultation fee only"],["Payment","Pay after provider acceptance"]].map(([label,value]) => <div key={label} className="booking-summary-line"><span>{label}</span><strong>{value || "Not specified"}</strong></div>)}</div></div>}
    {step === confirmationStep && <div className="booking-main-card booking-confirmation"><div className="booking-success-illustration"><CheckCircle2 size={42}/></div><div className="eyebrow">REQUEST CREATED</div><h2>Request received</h2><p className="booking-muted">Your request is in the {homecare ? "Homecare coordination" : "Doctor"} workspace. The provider must accept it before checkout is enabled.</p><div className="booking-summary-table">{[["Reference",submittedRequest?.id || "Test request"],["Service",submittedRequest?.serviceType || service.title],["Preferred date",submittedRequest?.requestedDate || date],["Preferred time",submittedRequest?.requestedTime || time],["Status","Awaiting provider review"],["Quoted amount","R" + Number(submittedRequest?.servicePrice || submittedRequest?.consultationFee || 0).toFixed(2)],["Payment","Pay after provider acceptance"]].map(([label,value])=><div key={label} className="booking-summary-line"><span>{label}</span><strong>{value}</strong></div>)}</div><div className="booking-confirm-note"><ShieldCheck size={17}/> Sandbox simulation · Provider action and payment authorisation are simulated</div></div>}
    {message && <div className="booking-validation-error"><AlertCircle size={17}/> {message}</div>}
    {step < confirmationStep && <div className="booking-actions"><button type="button" className="button button-outline" onClick={step === 0 ? onBack : () => {setStep(current => current - 1);setMessage("");}}><ArrowLeft size={16}/> {step === 0 ? "Home" : "Back"}</button>{step < reviewStep ? <button type="button" className="button button-primary" onClick={next}>{step === 0 && !homecare ? "Find suitable doctors" : step === 1 && !homecare ? "Continue to details" : "Continue"} <ArrowRight size={16}/></button> : <button type="button" className="button button-primary" onClick={submit}>Submit request <ArrowRight size={16}/></button>}</div>}
    {step === confirmationStep && <div className="booking-actions"><button type="button" className="button button-outline" onClick={onBack}>Back to home</button><button type="button" className="button button-primary" onClick={onOpenActivities}>View Activities <ArrowRight size={16}/></button></div>}
  </section>;
}
