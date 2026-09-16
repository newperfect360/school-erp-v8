import { useState } from "react";
import { qrImage } from "../qr";

export default function Certificates() {
  const [form, setForm] = useState({
    name: "",
    grNo: "",
    className: "",
    reason: "Bonafide Certificate",
    mobile: "",
  });

  const qrText = `Certificate Verify: ${form.name} GR:${form.grNo}`;
  const qrUrl = qrImage(qrText);

  const printCertificate = () => window.print();

  const sendWhatsApp = () => {
    const msg = `प्रमाणपत्र तयार आहे.\nविद्यार्थी: ${form.name}\nGR No: ${form.grNo}\nप्रमाणपत्र: ${form.reason}\nQR Verification उपलब्ध आहे.`;
    if (!/^(?:\+?91)?\d{10}$/.test(form.mobile.trim())) { alert("वैध 10 अंकी मोबाईल नंबर भरा"); return; }
    window.open(`https://wa.me/91${form.mobile.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="page">
      <h2>📄 प्रमाणपत्र + QR + WhatsApp</h2>

      <div className="form-grid">
        <input placeholder="विद्यार्थी नाव" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="GR No." value={form.grNo} onChange={(e) => setForm({ ...form, grNo: e.target.value })} />
        <input placeholder="इयत्ता" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
        <select value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}>
          <option>Bonafide Certificate</option>
          <option>Study Certificate</option>
          <option>Character Certificate</option>
          <option>Leaving Certificate</option>
        </select>
        <input placeholder="WhatsApp Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2>{form.reason}</h2>
        <p>हे प्रमाणित करण्यात येते की विद्यार्थी <b>{form.name}</b> GR No. <b>{form.grNo}</b> इयत्ता <b>{form.className}</b> मध्ये शिक्षण घेत आहे.</p>
        {qrUrl ? <img src={qrUrl} alt="QR" width="120" height="120" /> : <p>QR साठी मजकूर खूप मोठा आहे.</p>}
        <p>QR Verification Code</p>
      </div>

      <button onClick={printCertificate}>PDF / Print</button>
      <button onClick={sendWhatsApp}>WhatsApp पाठवा</button>
    </div>
  );
}
