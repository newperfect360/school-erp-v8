import { notify } from "../components/Feedback";
import { useState } from "react";
import { localDate } from "../storage";

export default function Reports() {
  const [type, setType] = useState("विद्यार्थी अहवाल");
  const [date, setDate] = useState(localDate());

  const generateReport = () => {
    notify("हा नमुना preview आहे. वास्तविक डेटाचा Report Generator या React आवृत्तीत अद्याप उपलब्ध नाही.");
  };

  const sendWhatsApp = () => {
    const msg = `नमुना Report Preview: ${type}\nदिनांक: ${date}\nयात वास्तविक अहवालाचा डेटा जोडलेला नाही.`;
    const mobile = prompt("WhatsApp Mobile Number टाका");
    if (!mobile) return;
    if (!/^(?:\+?91)?\d{10}$/.test(mobile.trim())) { notify("वैध 10 अंकी मोबाईल नंबर भरा"); return; }
    window.open(`https://wa.me/91${mobile.slice(-10)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="page">
      <div className="module-heading"><div><span className="eyebrow">SCHOOL WORKSPACE</span><h2>शालेय अहवाल</h2><p>अहवाल preview आणि print</p></div></div>
      <div className="form-grid">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option>विद्यार्थी अहवाल</option>
          <option>शिक्षक अहवाल</option>
          <option>उपस्थिती अहवाल</option>
          <option>गृहपाठ अहवाल</option>
          <option>वर्गपाठ अहवाल</option>
          <option>निकाल अहवाल</option>
          <option>प्रमाणपत्र अहवाल</option>
          <option>WhatsApp Delivery Report</option>
        </select>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <button onClick={generateReport}>Generate Report</button>
      <button onClick={() => window.print()}>PDF / Print</button>
      <button onClick={sendWhatsApp}>WhatsApp Report</button>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>{type}</h3>
        <p>दिनांक: {date}</p>
        <p>नमुना preview: वास्तविक अहवालाचा डेटा या React आवृत्तीत जोडलेला नाही.</p>
      </div>
    </div>
  );
}
