import { useState } from "react";
import { useStoredState } from "../storage";

export default function Homework() {
  const [items, setItems] = useStoredState("erp_pro_homework", []);
  const [form, setForm] = useState({ date: "", className: "", subject: "", teacher: "", homework: "", mobile: "" });

  const save = () => {
    if (!form.className.trim() || !form.subject.trim() || !form.homework.trim()) {
      alert("इयत्ता, विषय आणि गृहपाठ भरा");
      return;
    }
    if (!setItems([...items, { id: crypto.randomUUID(), ...form }])) return;
    setForm({ date: "", className: "", subject: "", teacher: "", homework: "", mobile: "" });
  };

  const sendWhatsApp = (h) => {
    const msg = `गृहपाठ सूचना\nदिनांक: ${h.date}\nइयत्ता: ${h.className}\nविषय: ${h.subject}\nगृहपाठ: ${h.homework}\n- शिक्षक: ${h.teacher}`;
    if (!/^(?:\+?91)?\d{10}$/.test(h.mobile.trim())) { alert("वैध 10 अंकी मोबाईल नंबर भरा"); return; }
    window.open(`https://wa.me/91${h.mobile.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="page">
      <h2>📚 गृहपाठ + WhatsApp</h2>
      <div className="form-grid">
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input placeholder="इयत्ता" value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} />
        <input placeholder="विषय" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
        <input placeholder="शिक्षक नाव" value={form.teacher} onChange={(e) => setForm({ ...form, teacher: e.target.value })} />
        <input placeholder="WhatsApp Mobile" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        <textarea placeholder="गृहपाठ" value={form.homework} onChange={(e) => setForm({ ...form, homework: e.target.value })}></textarea>
      </div>
      <button onClick={save}>Save Homework</button>

      <table>
        <thead>
          <tr><th>दिनांक</th><th>इयत्ता</th><th>विषय</th><th>गृहपाठ</th><th>WhatsApp</th></tr>
        </thead>
        <tbody>
          {items.map((h) => (
            <tr key={h.id}>
              <td>{h.date}</td><td>{h.className}</td><td>{h.subject}</td><td>{h.homework}</td>
              <td><button onClick={() => sendWhatsApp(h)}>WhatsApp पाठवा</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
