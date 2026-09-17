import { notify } from "../components/Feedback";
import { useState } from "react";
import { qrImage } from "../qr";

export default function IDCard() {
  const [imageLoading, setImageLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    grNo: "",
    className: "",
    division: "",
    mobile: "",
    photo: "",
  });

  const change = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      if (!files?.[0]) return;
      if (!files[0].type.startsWith("image/") || files[0].size > 2 * 1024 * 1024) { notify("2 MB पेक्षा लहान image निवडा"); return; }
      setImageLoading(true);
      const reader = new FileReader();
      reader.onerror = () => { setImageLoading(false); notify("फोटो वाचता आला नाही. पुन्हा निवडा."); };
      reader.onload = () => { setForm(current => ({ ...current, photo: reader.result })); setImageLoading(false); };
      reader.readAsDataURL(files[0]);
    } else setForm({ ...form, [name]: value });
  };

  const qrText = `Student ID: ${form.name} GR:${form.grNo}`;
  const qrUrl = qrImage(qrText);

  const sendWhatsApp = () => {
    const msg = `ID Card तयार आहे.\nविद्यार्थी: ${form.name}\nGR No: ${form.grNo}\nQR Verification उपलब्ध आहे.`;
    if (!/^(?:\+?91)?\d{10}$/.test(form.mobile.trim())) { notify("वैध 10 अंकी मोबाईल नंबर भरा"); return; }
    window.open(`https://wa.me/91${form.mobile.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="page">
      <div className="module-heading"><div><span className="eyebrow">SCHOOL WORKSPACE</span><h2>विद्यार्थी ओळखपत्र</h2><p>विद्यार्थ्याच्या माहितीसह ओळखपत्र preview</p></div></div>

      <div className="form-grid">
        <label>विद्यार्थी नाव<input name="name" placeholder="विद्यार्थी नाव" value={form.name} onChange={change} /></label>
        <label>GR No.<input name="grNo" placeholder="GR No." value={form.grNo} onChange={change} /></label>
        <label>इयत्ता<input name="className" placeholder="इयत्ता" value={form.className} onChange={change} /></label>
        <label>तुकडी<input name="division" placeholder="तुकडी" value={form.division} onChange={change} /></label>
        <label>WhatsApp Mobile<input name="mobile" placeholder="WhatsApp Mobile" value={form.mobile} onChange={change} /></label>
        <input type="file" name="photo" accept="image/*" onChange={change} />
      </div>

      <div className="card" style={{ width: 350, maxWidth: "100%", marginTop: 20 }}>
        <h3>School ID Card</h3>
        {form.photo ? <img src={form.photo} alt="विद्यार्थी फोटो" width="80" height="95" /> : <div>Photo</div>}
        <p><b>{form.name}</b></p>
        <p>GR: {form.grNo}</p>
        <p>Class: {form.className} - {form.division}</p>
        {qrUrl ? <img src={qrUrl} alt="QR" width="100" height="100" /> : <p>QR साठी मजकूर खूप मोठा आहे.</p>}
      </div>

      <button onClick={() => { if (!imageLoading) window.print(); }} disabled={imageLoading}>PDF / Print</button>
      <button onClick={sendWhatsApp}>WhatsApp पाठवा</button>
    </div>
  );
}
