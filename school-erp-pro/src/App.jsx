import { useEffect, useRef, useState } from "react";
import { readStored } from "./storage";
import Dashboard from "./pages/Dashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
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
import SchoolLogin from "./pages/SchoolLogin";
import OperationalModules from "./pages/OperationalModules";
import SchoolOperations from "./pages/SchoolOperations";
import Icon from "./components/Icon";
import Feedback, { PageBoundary } from "./components/Feedback";
import { academicYear, studentDisplayName, useLanguage } from "./design/language";
import { Avatar, LanguageSwitch, SchoolMark } from "./design/SchoolUI";
import { navigationGroups, navigationItems } from "./design/navigation";
import "./App.css";

const pages = { Students, Teachers, Attendance, Homework, Classwork, Certificates, Results, IDCard, Reports, Parents, Trips, Sports, Library };
const defaults = { schoolName: "स्व. गुरुबक्षसिंग साबरवाल माध्यमिक व उच्च माध्यमिक विद्यालय", sansthaName: "स्व. अमानउल्ला मोतीवाला शिक्षण प्रसारक मंडळ", address: "नायगाव (भिकापूर), छत्रपती संभाजीनगर", principal: "मुख्याध्यापक", logo: "" };

export default function App() {
  const { language, t } = useLanguage();
  const [settings, setSettings] = useState(() => readStored("schoolSettings", defaults));
  const [login, setLogin] = useState(false);
  const [active, setActive] = useState("Dashboard");
  const [pageOptions, setPageOptions] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const sidebarRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = (key, options = {}) => { setActive(key); setPageOptions(options); setSidebarOpen(false); setSearchOpen(false); setQuery(""); window.scrollTo({ top: 0 }); };
  const activeItem = navigationItems.find(item => item[0] === active);
  const Page = pages[active];
  const searchModules = query.trim() ? navigationItems.filter(item => `${item[1]} ${item[2]}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 4) : [];
  const searchStudents = login && query.trim() ? readStored("erp_pro_students", []).filter(s => !s.archivedAt && `${s.name} ${s.student_name_en || ""} ${s.student_name_mr || ""} ${s.grNo}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5) : [];

  useEffect(() => {
    if (!sidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector("button")?.focus();
    const keyboard = event => {
      if (event.key === "Escape") { setSidebarOpen(false); menuRef.current?.focus(); }
      if (event.key === "Tab") {
        const buttons = [...sidebarRef.current.querySelectorAll("button")].filter(button => button.offsetParent !== null);
        if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
        if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
      }
    };
    document.addEventListener("keydown", keyboard);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", keyboard); };
  }, [sidebarOpen]);

  return <div className="design-system">
    <Feedback />
    {!login ? <SchoolLogin settings={settings} onLogin={() => { setLogin(true); setActive("Dashboard"); setPageOptions({}); }} /> : <div className={`erp-layout${sidebarOpen ? " sidebar-is-open" : ""}`}>
      <a className="skip-link" href="#school-main">{t("Skip to content", "मुख्य भागाकडे जा")}</a>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => { setSidebarOpen(false); menuRef.current?.focus(); }} aria-hidden="true" />}
      <aside ref={sidebarRef} className="sidebar" aria-label={t("Main navigation", "मुख्य नेव्हिगेशन")}>
        <div className="brand-lockup"><SchoolMark logo={settings.logo} /><div><strong>{t("Vidyalaya", "विद्यालय")}</strong><span>{t("THE SCHOOL WORKSPACE", "शालेय कार्यस्थान")}</span></div><button className="mobile-close icon-button" onClick={() => { setSidebarOpen(false); menuRef.current?.focus(); }} aria-label="Close navigation"><Icon name="close" /></button></div>
        <div className="sidebar-school"><span>{t("G. S. Secondary School", "गु. सा. माध्यमिक विद्यालय")}</span><small>{t("Naigaon · Maharashtra", "नायगाव · महाराष्ट्र")}</small></div>
        <nav className="sidebar-nav">{navigationGroups.map(group => <div className="nav-group" key={group.en}><div className="sidebar-section-label">{t(group.en, group.mr)}</div>{group.items.map(([key, en, mr, icon, legacyLabel]) => <button key={key} data-nav={key} aria-label={language === "mr" ? legacyLabel || mr : en} aria-current={active === key ? "page" : undefined} className={`menu-btn${active === key ? " active" : ""}`} onClick={() => navigate(key)}><Icon name={icon} size={19} /><span>{t(en, mr)}</span>{active === key && <Icon name="chevron" size={14} />}</button>)}</div>)}</nav>
        <div className="sidebar-footer"><Avatar name="School Admin" /><div><strong>{t("School administrator", "शाळा प्रशासक")}</strong><span>{t("School office", "शालेय कार्यालय")}</span></div><button className="icon-button logout" aria-label="Logout" title={t("Sign out", "बाहेर पडा")} onClick={() => { setLogin(false); setSidebarOpen(false); setSearchOpen(false); setQuery(""); }}><Icon name="logout" size={18} /></button></div>
      </aside>
      <div className="main-area">
        <header className="top-header"><button ref={menuRef} className="mobile-menu icon-button" onClick={() => setSidebarOpen(true)} aria-label="Open navigation" aria-expanded={sidebarOpen}><Icon name="menu" /></button>
          <div className="header-copy"><div className="header-school" title={settings.schoolName}>{settings.schoolName}</div><div className="breadcrumb">{t("My school", "आपली शाळा")}<Icon name="chevron" size={12} /><strong>{activeItem ? t(activeItem[1], activeItem[2]) : active}</strong></div></div>
          <div className="header-actions"><span className="academic-year"><Icon name="calendar" size={15} />{academicYear(settings)}</span><LanguageSwitch /><button className="icon-button" aria-label="Search school" aria-expanded={searchOpen} onClick={() => setSearchOpen(!searchOpen)}><Icon name="search" /></button><button className="icon-button notification-button" aria-label={t("Open noticeboard", "सूचना केंद्र उघडा")} onClick={() => navigate("Notices")}><Icon name="bell" /></button><button className="profile-button" onClick={() => navigate("TeacherDashboard")} aria-label={t("Open teaching workspace", "शिक्षक कार्यस्थान उघडा")}><Avatar name="School Admin" /></button></div>
        </header>
        {searchOpen && <section className="school-search" aria-label="School search"><label><Icon name="search" size={18} /><input autoFocus aria-label="Search students or modules" placeholder={t("Search a student, GR number or module…", "विद्यार्थी, GR क्रमांक किंवा विभाग शोधा…")} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === "Escape") setSearchOpen(false); }} /></label>{query.trim() && <div className="search-results">{searchModules.map(([key, en, mr, icon]) => <button key={key} onClick={() => navigate(key)}><Icon name={icon} />{t(en, mr)}<Icon name="arrow" size={16} /></button>)}{searchStudents.map(s => <button key={s.id} onClick={() => navigate("Students", { studentId: s.id })}><Avatar name={s.name} photo={s.photo} size="small" /><span>{studentDisplayName(s, language)}<small>{t("Class", "इयत्ता")} {s.className}/{s.division} · GR {s.grNo}</small></span><Icon name="arrow" size={16} /></button>)}{!searchModules.length && !searchStudents.length && <p>{t("No matching students or modules.", "संबंधित विद्यार्थी किंवा विभाग सापडला नाही.")}</p>}</div>}</section>}
        <main id="school-main" tabIndex={-1} className="page-content"><PageBoundary key={active}>
          {active === "Dashboard" ? <Dashboard settings={settings} onNavigate={navigate} /> : active === "TeacherDashboard" ? <TeacherDashboard onNavigate={navigate} /> : active === "Settings" ? <Settings onSaved={setSettings} /> : ["Admissions", "Library", "Inventory", "Timetable", "Calendar", "Staff", "Backup"].includes(active) ? <SchoolOperations key={active} module={active} /> : Page ? <Page key={`${active}:${pageOptions.studentId || ""}:${pageOptions.initialClass || ""}:${pageOptions.initialDivision || ""}`} {...pageOptions} onNavigate={navigate} settings={settings} /> : <OperationalModules key={active} module={active} />}
        </PageBoundary></main>
        <footer className="workspace-footer"><span><Icon name="cap" size={15} />{t("Every student. Every possibility.", "प्रत्येक विद्यार्थी. प्रत्येक संधी.")}</span><span>{t("Academic year", "शैक्षणिक वर्ष")} {academicYear(settings)}</span></footer>
        <nav className="mobile-bottom-nav" aria-label="Quick navigation">{[["Dashboard", "Home", "मुख्यपृष्ठ", "grid"], ["Students", "Students", "विद्यार्थी", "users"], ["Attendance", "Attendance", "उपस्थिती", "calendar"], ["TeacherDashboard", "My day", "माझा दिवस", "cap"]].map(([key, en, mr, icon]) => <button key={key} onClick={() => navigate(key)} aria-current={active === key ? "page" : undefined}><Icon name={icon} size={21} /><span>{t(en, mr)}</span></button>)}</nav>
      </div>
    </div>}
  </div>;
}
