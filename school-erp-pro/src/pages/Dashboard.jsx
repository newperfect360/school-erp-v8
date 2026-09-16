import "./Dashboard.css";
import { readStored, localDate } from "../storage";

export default function Dashboard({ settings = {} }) {
  const students = readStored("erp_pro_students", []);
  const attendance = readStored("erp_pro_attendance", {})[localDate()] || {};
  const trips = readStored("erp_pro_trips", []);
  const scholarships = readStored("erp_pro_scholarships", []);
  const meetings = readStored("erp_pro_meetings", []);
  const pendingConsents = trips.reduce((total, trip) => total + trip.participants.filter((participant) => participant.consent === "प्रलंबित").length, 0);
  const classCards = ["8", "9", "10", "11", "12"].map((className) => ({ title: `${className}वी विद्यार्थी`, value: students.filter((student) => student.className === className).length, icon: "◈" }));
  const cards = [
    { title: "विद्यार्थी", value: students.length, icon: "🎓" },
    { title: "शिक्षक", value: readStored("erp_pro_teachers", []).length, icon: "👨‍🏫" },
    { title: "आज उपस्थित", value: students.filter(s => attendance[s.id] === "Present").length, icon: "✅" },
    { title: "आज अनुपस्थित", value: students.filter(s => attendance[s.id] === "Absent").length, icon: "❌" },
    { title: "गृहपाठ", value: readStored("erp_pro_homework", []).length, icon: "📚" },
    { title: "वर्गपाठ", value: readStored("erp_pro_classwork", []).length, icon: "📝" },
    { title: "निकाल QR", value: "0", icon: "📊" },
    { title: "प्रमाणपत्र QR", value: "0", icon: "📄" },
    { title: "ID Card QR", value: "0", icon: "🆔" },
    { title: "Reports", value: "0", icon: "📈" },
    { title: "WhatsApp", value: "Web Link", icon: "📲" },
    { title: "सक्रिय सहली", value: trips.length, icon: "🧭" },
    { title: "प्रलंबित संमती", value: pendingConsents, icon: "✍️" },
    { title: "शिष्यवृत्ती", value: scholarships.length, icon: "🏅" },
    { title: "पालक सभा", value: meetings.length, icon: "👥" },
  ];

  return (
    <div className="dashboard-page">
      <div className="dash-hero">
        <div className="school-logo-box">🏫</div>
        <div>
          <h4>{settings.sansthaName || "स्व. अमानउल्ला मोतीवाला शिक्षण प्रसारक मंडळ, औरंगाबाद"}</h4>
          <h1>{settings.schoolName || "स्व. गुरुबक्षसिंग साबरवाल माध्यमिक व उच्च माध्यमिक विद्यालय"}</h1>
          <h3>{settings.address || "नायगाव (भिकापूर), ता. जि. छत्रपती संभाजीनगर"}</h3>
          <p>शैक्षणिक वर्ष २०२६–२७ · आजची शाळा स्थिती</p>
        </div>
      </div>

      <div className="dash-grid">
        {[...classCards, ...cards].map((card, index) => (
          <div className="dash-card" key={index}>
            <div className="dash-icon">{card.icon}</div>
            <div>
              <h3>{card.title}</h3>
              <h2>{card.value}</h2>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-section">
        <h2>📌 कामकाज केंद्र</h2>
        <p>{students.length ? "आजची उपस्थिती, पालक संवाद आणि आगामी शैक्षणिक सहली येथे व्यवस्थापित करा." : "विद्यार्थी मास्टरमध्ये पहिली नोंद तयार केल्यावर dashboardवरील आकडे आपोआप अपडेट होतील."}</p>
      </div>
    </div>
  );
}
