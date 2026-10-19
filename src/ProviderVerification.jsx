import { useEffect, useState } from "react";
import { addDoc, collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";
import { AlertCircle, ShieldCheck } from "lucide-react";
import { db, firebaseConfigured } from "./firebase";

const types = [{value:"doctor",label:"Doctor / practitioner"},{value:"pharmacy",label:"Pharmacy"},{value:"homecare",label:"Homecare provider"}];

export default function ProviderVerification({user, workspaceRole=""}) {
  const [form,setForm] = useState({role:"doctor",organisationName:"",registrationNumber:"",location:"",phone:"",notes:""});
  const [mine,setMine] = useState([]);
  const [pending,setPending] = useState([]);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");

  useEffect(()=>{
    if(!db||!user){setMine([]);return;}
    return onSnapshot(query(collection(db,"providerApplications"),where("applicantUid","==",user.uid)),
      s=>setMine(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis?.()||0)-(a.createdAt?.toMillis?.()||0))),()=>setError("Your application status could not be loaded."));
  },[user]);

  useEffect(()=>{
    if(!db||!user||!["admin","super_admin"].includes(workspaceRole)){setPending([]);return;}
    return onSnapshot(query(collection(db,"providerApplications"),where("status","==","pending")),
      s=>setPending(s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(a.createdAt?.toMillis?.()||0)-(b.createdAt?.toMillis?.()||0))),()=>setError("Pending applications could not be loaded. Check admin permissions and Firestore indexes."));
  },[user,workspaceRole]);

  const submit = async e=>{
    e.preventDefault();
    if(!user||!db||!firebaseConfigured){setError("Sign in and configure Firebase before applying.");return;}
    if(mine.some(a=>["pending","approved"].includes(a.status))){setError("You already have a pending or approved application.");return;}
    setBusy(true);setError("");setMessage("");
    try {
      await addDoc(collection(db,"providerApplications"),{applicantUid:user.uid,applicantEmail:user.email||"",applicantName:user.displayName||"",...form,
        organisationName:form.organisationName.trim(),registrationNumber:form.registrationNumber.trim(),location:form.location.trim(),phone:form.phone.trim(),notes:form.notes.trim(),
        status:"pending",createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
      setMessage("Application submitted for review. Provider access has not been granted.");
    } catch(e) {setError(e?.code==="permission-denied"?"Firestore rules blocked this application. Deploy the providerApplications rules first.":"Application was not saved; no confirmation was recorded.");}
    finally {setBusy(false);}
  };

  const review = async (a,status)=>{
    if(!db||!["admin","super_admin"].includes(workspaceRole))return;
    if(status==="approved"&&!window.confirm("Confirm you independently verified the applicant's identity and registration with the relevant regulator before approval?"))return;
    setBusy(true);setError("");setMessage("");
    try {
      const batch = writeBatch(db);
      batch.update(doc(db,"providerApplications",a.id),{status,reviewedBy:user.uid,reviewedAt:serverTimestamp(),updatedAt:serverTimestamp()});
      if(status==="approved"){
        batch.set(doc(db,"user_roles",a.applicantUid),{role:a.role,verified:true,verificationStatus:"verified",status:"approved",
          displayName:a.applicantName||a.applicantEmail,businessName:a.organisationName||"",registrationNumber:a.registrationNumber||"",location:a.location||"",approvedAt:serverTimestamp(),approvedBy:user.uid});
        if(a.role==="doctor")batch.set(doc(db,"doctors",a.applicantUid),{name:a.applicantName||a.applicantEmail,specialty:"Healthcare professional",location:a.location||"",verified:true,verificationStatus:"verified",providerUid:a.applicantUid,updatedAt:serverTimestamp()});
      }
      await batch.commit();
      setMessage(status==="approved"?"Provider role granted after review.":"Application rejected.");
    } catch(e){setError(e?.code==="permission-denied"?"Admin action denied by Firestore rules.":"Review did not finish; inspect application and role records before retrying.");}
    finally{setBusy(false);}
  };

  if(!user)return <div className="panel"><h2>Provider verification</h2><p className="muted">Sign in before applying to become a provider.</p></div>;
  return <div className="panel">
    <div className="panel-heading"><div className="panel-icon"><ShieldCheck/></div><div><h2>Provider verification</h2><p>Approval requires an administrator to check registration.</p></div></div>
    {error&&<div className="inline-message"><AlertCircle size={18}/><span>{error}</span></div>}
    {message&&<div className="inline-message"><ShieldCheck size={18}/><span>{message}</span></div>}
    {!["admin","super_admin"].includes(workspaceRole)&&<form className="verification-form" onSubmit={submit}>
      <label>Provider type<select required value={form.role} onChange={e=>setForm({...form,role:e.target.value})}>{types.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></label>
      <label>Practice / pharmacy / organisation name<input required value={form.organisationName} onChange={e=>setForm({...form,organisationName:e.target.value})}/></label>
      <label>Professional or business registration number<input required value={form.registrationNumber} onChange={e=>setForm({...form,registrationNumber:e.target.value})}/></label>
      <label>Town / service area<input required value={form.location} onChange={e=>setForm({...form,location:e.target.value})}/></label>
      <label>Contact phone<input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
      <label>Specialty / service details<textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label>
      <div className="inline-message"><ShieldCheck size={17}/><span>Do not enter patient data here. No documents are uploaded. An administrator must independently verify registration; submitting does not grant access.</span></div>
      <button className="button button-primary full" disabled={busy}>{busy?"Submitting…":"Submit for verification"}</button>
    </form>}
    <h3 style={{marginTop:22}}>Your applications</h3>
    {mine.length?mine.map(a=><div className="notification-item" key={a.id}><span className="notification-dot"/><div><strong>{types.find(t=>t.value===a.role)?.label||a.role}</strong><p>{a.organisationName} · {a.location}</p><p>Status: <b>{a.status}</b></p></div></div>):<p className="muted small">No applications submitted.</p>}
    {["admin","super_admin"].includes(workspaceRole)&&<><div className="panel-heading" style={{marginTop:24}}><div className="panel-icon"><ShieldCheck/></div><div><h2>Pending reviews</h2><p>Independently check the relevant regulator before approval.</p></div></div>
      {!pending.length?<p className="muted small">No pending applications.</p>:pending.map(a=><article className="notification-item" key={a.id}><span className="notification-dot"/><div style={{width:"100%"}}><strong>{a.organisationName} · {a.role}</strong><p>{a.applicantName||a.applicantEmail} · {a.applicantEmail}</p><p>Registration: {a.registrationNumber}</p><p>{a.location} · {a.phone}</p>{a.notes&&<p>{a.notes}</p>}<div className="filter-row"><button type="button" className="button button-outline" disabled={busy} onClick={()=>review(a,"rejected")}>Reject</button><button type="button" className="button button-primary" disabled={busy} onClick={()=>review(a,"approved")}>Approve after checks</button></div></div></article>)}
    </>}
  </div>;
}
