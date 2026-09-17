import { useState } from "react";
import { readStored } from "./storage";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Attendance from "./pages/Attendance";
import Homework from "./pages/Homework";
import Classwork from "./pages/Classwork";
import Certificates from "./pages/Certificates";
import Results from "./pages/Results";
import IDCard from "./pages/IDCard";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Parents from "./pages/Parents";
import Trips from "./pages/Trips";
import Sports from "./pages/Sports";
import Library from "./pages/Library";
import OperationalModules from "./pages/OperationalModules";
import SchoolOperations from "./pages/SchoolOperations";
import Icon from "./components/Icon";
import Feedback, { notify, PageBoundary } from "./components/Feedback";
import "./App.css";

const groups = [
  { title: "आढावा", items: [["Dashboard", "मुख्यपृष्ठ", "grid", "Dashboard"]] },
  { title: "शैक्षणिक व्यवस्थापन", items: [["Students", "विद्यार्थी", "users"], ["Teachers", "शिक्षक", "book"], ["Attendance", "उपस्थिती", "calendar"], ["Parents", "पालक", "users"], ["Homework", "गृहपाठ", "book"], ["Classwork", "वर्गपाठ", "file"], ["Results", "परीक्षा व निकाल", "chart", "निकाल"], ["Sports", "क्रीडा", "trophy"], ["Trips", "शैक्षणिक सहल", "pin"], ["Library", "ग्रंथालय", "book"]] },
  { title: "शालेय कार्यालय", items: [["Admissions", "प्रवेश आणि GR", "file"], ["Fees", "शुल्क", "wallet"], ["Certificates", "प्रमाणपत्र", "file"], ["IDCard", "ओळखपत्र", "users", "ID Card"], ["Notices", "सूचना", "bell"], ["Reports", "अहवाल", "chart", "Reports"], ["Scholarships", "शिष्यवृत्ती", "trophy"], ["Meetings", "पालक सभा", "users"], ["Transport", "वाहतूक", "pin"], ["Inventory", "मालमत्ता", "file"], ["Timetable", "वेळापत्रक", "calendar"], ["Calendar", "दिनदर्शिका", "calendar"], ["Staff", "कर्मचारी", "users"], ["Communications", "संवाद नोंद", "bell"], ["Automation", "स्वयंचलित नियम", "settings"], ["Backup", "Backup आणि Audit", "file"], ["Settings", "सेटिंग्ज", "settings", "Settings"]] },
];
const pages = { Students, Teachers, Attendance, Homework, Classwork, Certificates, Results, IDCard, Reports, Parents, Trips, Sports, Library };
const defaults = { schoolName: "स्व. गुरुबक्षसिंग साबरवाल माध्यमिक व उच्च माध्यमिक विद्यालय", sansthaName: "स्व. अमानउल्ला मोतीवाला शिक्षण प्रसारक मंडळ", address: "नायगाव (भिकापूर), छत्रपती संभाजीनगर", principal: "मुख्याध्यापक", logo: "" };

export default function App() {
  const [settings, setSettings] = useState(() => readStored("schoolSettings", defaults));
  const [login, setLogin] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = key => { setActive(key); setSidebarOpen(false); window.scrollTo({ top: 0 }); };
  const activeLabel = groups.flatMap(group => group.items).find(item => item[0] === active)?.[1];
  const Page = pages[active];

  return <>
    <Feedback />
    {!login ? <div className="login-page">
      <aside className="login-aside">
        <div className="login-brand"><div className="brand-mark"><Icon name="school" size={30} /></div><span>विद्यालय<span>SCHOOL MANAGEMENT</span></span></div>
        <div className="login-story"><span className="eyebrow">A LITTLE MORE CLARITY. EVERY DAY.</span><h1>शाळेचे प्रत्येक काम.<br /><em>एकाच ठिकाणी.</em></h1><p>विद्यार्थी, शिक्षक आणि शाळेची दैनंदिन कामे—आता अधिक सुटसुटीत, अधिक व्यवस्थित.</p>
          <div className="login-illustration" aria-hidden="true"><div className="illustration-book"><Icon name="book" size={84} /></div><span className="illustration-note note-one"><Icon name="check" /> उपस्थिती</span><span className="illustration-note note-two"><Icon name="users" /> विद्यार्थी</span><div className="illustration-dot" /></div>
        </div>
        <div className="login-aside-footer">शिक्षणाला समर्पित. व्यवस्थापनासाठी सुलभ.</div>
      </aside>
      <main className="login-main"><form className="login-box" onSubmit={event => {
        event.preventDefault(); const data = new FormData(event.currentTarget);
        if (data.get("username") === "admin" && data.get("password") === "123456") setLogin(true);
        else notify("Username किंवा Password चुकीचा आहे. पुन्हा प्रयत्न करा.");
      }}><span className="eyebrow">आपले स्वागत आहे</span><h2>School workspace</h2><p className="login-lead">आपल्या शाळेच्या व्यवस्थापनासाठी प्रवेश करा.</p>
        <label>वापरकर्ता नाव<input name="username" aria-label="Username" autoComplete="username" placeholder="Username" required /></label>
        <label>पासवर्ड<input name="password" aria-label="Password" autoComplete="current-password" type="password" placeholder="Password" required /></label>
        <button type="submit" aria-label="Login">प्रवेश करा <Icon name="arrow" size={18} /></button>
        <div className="login-hint"><span>LOCAL DEMO ACCESS</span><code>admin</code><span>/</span><code>123456</code></div>
        <div className="login-school"><Icon name="school" size={20} /><p>{settings.schoolName}<small>{settings.address}</small></p></div>
      </form><p className="login-bottom">School ERP · शालेय व्यवस्थापन</p></main>
    </div> : <div className={`erp-layout${sidebarOpen ? " sidebar-is-open" : ""}`}>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
      <aside className="sidebar" aria-label="मुख्य नेव्हिगेशन"><div className="brand-lockup"><div className="brand-mark"><Icon name="school" size={25} /></div><div><strong>विद्यालय</strong><span>SCHOOL WORKSPACE</span></div><button className="mobile-close icon-button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><Icon name="close" /></button></div>
        <nav className="sidebar-nav">{groups.map(group => <div className="nav-group" key={group.title}><div className="sidebar-section-label">{group.title}</div>{group.items.map(([key, label, icon, accessibleLabel]) => <button key={key} aria-label={accessibleLabel || label} aria-current={active === key ? "page" : undefined} className={`menu-btn${active === key ? " active" : ""}`} onClick={() => navigate(key)}><Icon name={icon} size={18} /><span>{label}</span>{active === key && <span className="active-dot" />}</button>)}</div>)}</nav>
        <div className="sidebar-footer"><div className="avatar">AD</div><div><strong>शाळा प्रशासक</strong><span>Administrator</span></div><button className="icon-button logout" aria-label="Logout" title="Logout" onClick={() => { setLogin(false); setSidebarOpen(false); }}><Icon name="logout" size={19} /></button></div>
      </aside>
      <main className="main-area"><header className="top-header"><button className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Icon name="menu" /></button><div className="header-copy"><div className="header-school">{settings.schoolName}</div><div className="breadcrumb">शालेय व्यवस्थापन <Icon name="chevron" size={12} /><strong>{activeLabel}</strong></div></div><div className="header-actions"><span className="status-pill"><span /> Local workspace</span><div className="avatar">AD</div></div></header>
        <div className="page-content"><PageBoundary key={active}>
          {active === "Dashboard" ? <Dashboard settings={settings} onNavigate={navigate} /> : active === "Settings" ? <Settings onSaved={setSettings} /> : ["Admissions", "Library", "Inventory", "Timetable", "Calendar", "Staff", "Backup"].includes(active) ? <SchoolOperations module={active} /> : Page ? <Page /> : <OperationalModules key={active} module={active} />}
        </PageBoundary></div>
        <footer className="workspace-footer"><span>School ERP</span><span>शिक्षणासाठी अधिक वेळ. व्यवस्थापनासाठी अधिक सुलभता.</span></footer>
      </main>
    </div>}
  </>;
}
