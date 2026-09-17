import { notify } from "../components/Feedback";
import { useState } from "react";
import { qrImage } from "../qr";
import { readStored, useStoredState } from "../storage";

export default function Certificates() {
  const students = readStored("erp_pro_students", []);
  const [history, setHistory] = useStoredState("erp_pro_certificates", []);
  const [form, setForm] = useState({
    name: "",
    grNo: "",
    className: "",
    reason: "Bonafide Certificate",
    mobile: "", purpose: "शैक्षणिक वापर",
  });

  const qrText = `Certificate Verify: ${form.name} GR:${form.grNo}`;
  const qrUrl = qrImage(qrText);

  const generate = () => {
    if (!form.name.trim() || !form.grNo.trim() || !form.className.trim()) { notify("विद्यार्थी, GR आणि इयत्ता भरा"); return; }
    const certificate = { id: crypto.randomUUID(), ...form, certificateNo: `CERT-${Date.now().toString().slice(-6)}`, issueDate: new Date().toISOString().slice(0, 10) };
    if (!setHistory([...history, certificate])) return;
    setForm({ ...form, certificateNo: certificate.certificateNo, issueDate: certificate.issueDate });
    notify("प्रमाणपत्र नोंद तयार झाली");
  };
  const printCertificate = () => window.print();
  const selectStudent = (name) => { const student = students.find((item) => item.name === name); if (student) setForm({ ...form, name: student.name, grNo: student.grNo, className: student.className, mobile: student.mobile || "" }); else setForm({ ...form, name }); };

  const sendWhatsApp = () => {
    const msg = `प्रमाणपत्र तयार आहे.\nविद्यार्थी: ${form.name}\nGR No: ${form.grNo}\nप्रमाणपत्र: ${form.reason}\nQR Verification उपलब्ध आहे.`;
    if (!/^(?:\+?91)?\d{10}$/.test(form.mobile.trim())) { notify("वैध 10 अंकी मोबाईल नंबर भरा"); return; }
    window.open(`https://wa.me/91${form.mobile.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="page">
      <div className="module-heading"><div><span className="eyebrow">SCHOOL WORKSPACE</span><h2>प्रमाणपत्रे</h2><p>विद्यार्थी प्रमाणपत्र preview, QR आणि print</p></div></div>

      <div className="form-grid">
        <label>विद्यार्थी नाव<select aria-label="विद्यार्थी निवडा" value={form.name} onChange={(e) => selectStudent(e.target.value)}><option value="">विद्यार्थी निवडा</option>{students.map((student) => <option key={student.id} value={student.name}>{student.name} · {student.grNo}</option>)}</select></label>
        <label>GR No.<input placeholder="GR No." value={form.grNo} onChange={(e) => setForm({ ...form, grNo: e.target.value })} /></label>
        <label>इयत्ता<input placeholder="इयत्ता" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} /></label>
        <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
          <option>Bonafide Certificate</option>
          <option>Study Certificate</option>
          <option>Character Certificate</option>
          <option>Leaving Certificate</option>
        </select>
        <label>WhatsApp Mobile<input placeholder="WhatsApp Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></label>
        <label>Purpose<input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} /></label>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>{form.reason}</h2>
        <p>हे प्रमाणित करण्यात येते की विद्यार्थी <b>{form.name}</b> GR No. <b>{form.grNo}</b> इयत्ता <b>{form.className}</b> मध्ये शिक्षण घेत आहे.</p>
        {qrUrl ? <img src={qrUrl} alt="QR" width="120" height="120" /> : <p>QR साठी मजकूर खूप मोठा आहे.</p>}
        <p>Certificate No: {form.certificateNo || "नवीन प्रमाणपत्र generate करा"} · Issue date: {form.issueDate || new Date().toISOString().slice(0, 10)}</p>
      </div>

      <button onClick={generate}>प्रमाणपत्र तयार करा</button><button onClick={printCertificate}>PDF / Print</button>
      <button onClick={sendWhatsApp}>WhatsApp पाठवा</button>
      {history.length > 0 && <section className="workflow-panel"><div className="panel-title"><h3>प्रमाणपत्र इतिहास</h3><span>{history.length} नोंदी</span></div>{history.slice().reverse().map((item) => <div className="activity-row" key={item.id}><strong>{item.certificateNo}</strong><span>{item.name} · {item.reason} · {item.issueDate}</span></div>)}</section>}
    </div>
  );
}
