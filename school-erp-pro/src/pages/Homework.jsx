import { notify } from "../components/Feedback";
import { useState } from "react";
import { useStoredState } from "../storage";

export default function Homework() {
  const [items, setItems] = useStoredState("erp_pro_homework", []);
  const [form, setForm] = useState({ date: "", className: "", division: "", subject: "", teacher: "", homework: "", dueDate: "", mobile: "", attachment: "" });

  const save = () => {
    if (!form.className.trim() || !form.subject.trim() || !form.homework.trim() || !form.date) {
      notify("इयत्ता, विषय आणि गृहपाठ भरा");
      return;
    }
    if (!setItems([...items, { id: crypto.randomUUID(), ...form }])) return;
    setForm({ date: "", className: "", division: "", subject: "", teacher: "", homework: "", dueDate: "", mobile: "", attachment: "" });
  };

  const sendWhatsApp = (h) => {
    const msg = `गृहपाठ सूचना\nदिनांक: ${h.date}\nइयत्ता: ${h.className}\nविषय: ${h.subject}\nगृहपाठ: ${h.homework}\n- शिक्षक: ${h.teacher}`;
    if (!/^(?:\+?91)?\d{10}$/.test(h.mobile.trim())) { notify("वैध 10 अंकी मोबाईल नंबर भरा"); return; }
    window.open(`https://wa.me/91${h.mobile.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="page">
      <div className="module-heading"><div><span className="eyebrow">SCHOOL WORKSPACE</span><h2>गृहपाठ</h2><p>वर्गासाठी दिलेला गृहपाठ आणि पालक संवाद</p></div></div>
      <section className="workflow-panel"><div className="form-grid">
        <label>दिनांक<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
        <label>इयत्ता<input placeholder="इयत्ता" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} /></label>
        <label>विषय<input placeholder="विषय" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} /></label>
        <label>शिक्षक नाव<input placeholder="शिक्षक नाव" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} /></label>
        <label>तुकडी<input placeholder="तुकडी" value={form.division} onChange={(e) => setForm({ ...form, division: e.target.value })} /></label>
        <label>अंतिम दिनांक<input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></label>
        <label>WhatsApp Mobile<input placeholder="WhatsApp Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} /></label>
        <label>गृहपाठ<textarea placeholder="गृहपाठ" value={form.homework} onChange={(e) => setForm({ ...form, homework: e.target.value })}></textarea></label>
        <label>Attachment<input type="file" onChange={(e) => setForm({ ...form, attachment: e.target.files?.[0]?.name || "" })} /></label>
      </div><button onClick={save}>गृहपाठ जतन करा</button></section>

      <table>
        <thead>
          <tr><th>दिनांक</th><th>इयत्ता</th><th>विषय</th><th>गृहपाठ</th><th>Due Date</th><th>Attachment</th><th>WhatsApp</th></tr>
        </thead>
        <tbody>
          {items.map((h) => (
            <tr key={h.id}>
              <td>{h.date}</td><td>{h.className} {h.division}</td><td>{h.subject}</td><td>{h.homework}</td><td>{h.dueDate || "-"}</td><td>{h.attachment || "-"}</td>
              <td><button onClick={() => sendWhatsApp(h)}>WhatsApp पाठवा</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
