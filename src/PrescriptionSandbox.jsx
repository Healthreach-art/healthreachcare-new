import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, FileText, ShieldCheck, UploadCloud, AlertCircle, Clock3 } from "lucide-react";
import { saveTestPrescription, useTestWorkflow } from "./test-workflow.js";

const dateTime = value => value ? new Date(value).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" }) : "Not recorded";
const sizeLabel = value => value < 1024 * 1024 ? Math.max(1, Math.round(value / 1024)) + " KB" : (value / (1024 * 1024)).toFixed(1) + " MB";
const statusLabel = value => String(value || "").replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());

export default function PrescriptionSandbox({ onBack }) {
  const workflow = useTestWorkflow();
  const [patientName, setPatientName] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const records = (workflow.prescriptions || []).filter(item => item.testOnly === true);

  const submit = event => {
    event.preventDefault();
    setError(""); setNotice("");
    if (!file) { setError("Choose a sample PDF, JPG or PNG file to simulate the upload."); return; }
    try {
      const item = saveTestPrescription({ patientName, fileName: file.name, fileType: file.type, fileSize: file.size, notes });
      setFile(null); setNotes("");
      event.currentTarget.reset();
      workflow.refresh();
      setNotice("Prescription intake reference " + item.id + " created. File contents were not uploaded or stored; the pharmacy can review the simulated intake metadata.");
    } catch (e) { setError(e.message || "Could not create the simulated prescription request."); }
  };

  return <section className="page-content prescription-sandbox-page">
    <button className="text-button" type="button" onClick={onBack}><ArrowLeft size={15}/> Back to Home</button>
    <div className="eyebrow">PRESCRIPTION SERVICES</div><h1>Prescription review</h1>
    <p className="lead">Follow the prescription intake and pharmacy review journey, with a replaceable storage adapter ready for the private upload service.</p>
    <div className="prescription-sandbox-banner"><ShieldCheck size={20}/><div><strong>Secure-upload simulation</strong><p>Select a non-sensitive sample file only. The file is inspected in this browser for type and size, but its contents are never uploaded or saved. Only test metadata is recorded.</p></div></div>
    {error&&<div className="inline-message test-error"><AlertCircle size={18}/><span>{error}</span></div>}
    {notice&&<div className="inline-message"><CheckCircle2 size={18}/><span>{notice}</span></div>}
    <form className="panel prescription-intake-form" onSubmit={submit}>
      <div className="panel-heading"><div className="panel-icon"><UploadCloud/></div><div><h2>Start prescription intake</h2><p>Creates a sandbox reference and a pharmacy review task.</p></div></div>
      <label>Patient name (sandbox only)<input required maxLength={100} value={patientName} onChange={event=>setPatientName(event.target.value)} placeholder="Test patient name"/></label>
      <label>Sample prescription file<input required type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" onChange={event=>{setFile(event.target.files?.[0]||null);setError("");}}/><small>PDF, JPG or PNG · up to 5 MB. Do not select a real prescription or real patient document.</small></label>
      {file&&<div className="prescription-file-preview"><FileText size={21}/><div><strong>{file.name}</strong><small>{file.type || "Unknown file type"} · {sizeLabel(file.size)} · content will not be stored</small></div></div>}
      <label>Non-sensitive test note (optional)<textarea rows={3} maxLength={500} value={notes} onChange={event=>setNotes(event.target.value)} placeholder="Example: sample document for checking the review flow."/></label>
      <div className="prescription-consent"><ShieldCheck size={17}/><span>I understand this is a simulated intake. The file itself is not sent to a pharmacy and no medicine is approved or dispensed by this action.</span></div>
      <button type="submit" className="button button-primary"><UploadCloud size={17}/> Create prescription review request</button>
    </form>
    <div className="panel"><div className="panel-heading"><div className="panel-icon"><Clock3/></div><div><h2>Prescription requests</h2><p>Local sandbox records shared with the pharmacy workspace in this browser.</p></div></div>
      {records.length ? <div className="prescription-record-list">{records.map(item=><article className="prescription-record" key={item.id}><div className="prescription-record-head"><span className="prescription-file-icon"><FileText size={20}/></span><div><strong>{item.id}</strong><small>{item.patientName} · {dateTime(item.createdAt)}</small></div><span className={"request-status status-" + item.status}>{statusLabel(item.status)}</span></div><div className="prescription-record-meta"><span>{item.fileName}</span><span>{sizeLabel(item.fileSize)}</span><span>{item.fileStored ? "File stored" : "Metadata only"}</span></div>{item.reviewNote&&<p className="muted small">Pharmacy note: {item.reviewNote}</p>}</article>)}</div> : <div className="empty-state"><FileText size={28}/><h3>No prescription requests yet</h3><p>Create a sample intake to test pharmacy review and status updates.</p></div>}
    </div>
    <div className="prescription-production-note"><ShieldCheck size={18}/><p><strong>Production replacement point</strong><br/>The intake record is already separate from file storage. Later, replace the metadata-only adapter with authenticated uploads to private storage, pharmacy-specific access rules, audit events, retention/deletion controls and a verified review service. The screens and status lifecycle can remain.</p></div>
  </section>;
}
