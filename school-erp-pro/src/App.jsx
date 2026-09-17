import { useState } from "react";
import { readStored } from "./storage";
import PortalHome, { Academics } from "./pages/PortalHome";
import PortalShell from "./design/PortalShell";
import PortalContent from "./pages/PortalContent";
import PortalInfo from "./pages/PortalInfo";
import { canView } from "./design/portalNavigation";
import TeacherDashboard from "./pages/TeacherDashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Attendance from "./pages/Attendance";
import Homework from "./pages/Homework";
import Classwork from "./pages/Classwork";
import SchoolFormats from "./pages/SchoolFormats";
import Certificates from "./pages/Certificates";
import IDCard from "./pages/IDCard";
import Results from "./pages/Results";
import GeneralRegister from "./pages/GeneralRegister";
import Scholarships from "./pages/Scholarships";
import Communications from "./pages/Communications";
import AccessSetup from "./pages/AccessSetup";
import BackupRestore from "./pages/BackupRestore";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Parents from "./pages/Parents";
import Trips from "./pages/Trips";
import Sports from "./pages/Sports";
import Library from "./pages/Library";
import SchoolLogin from "./pages/SchoolLogin";
import OperationalModules from "./pages/OperationalModules";
import SchoolOperations from "./pages/SchoolOperations";
import Feedback, { PageBoundary } from "./components/Feedback";
import "./App.css";

const pages = { PortalInfo, PortalContent, Academics, Students, Teachers, Attendance, Homework, Classwork, Certificates, Formats: SchoolFormats, Admissions: GeneralRegister, Scholarships, Communications, AccessSetup, Backup: BackupRestore, Results, IDCard, Reports, Parents, Trips, Sports, Library };
const defaults = { schoolName: "स्व. गुरुबक्षसिंग साबरवाल माध्यमिक व उच्च माध्यमिक विद्यालय", sansthaName: "स्व. अमानउल्ला मोतीवाला शिक्षण प्रसारक मंडळ", address: "नायगाव (भिकापूर), छत्रपती संभाजीनगर", principal: "मुख्याध्यापक", logo: "" };

export default function App() {
  const [settings,setSettings]=useState(()=>readStored("schoolSettings",defaults));
  const [login,setLogin]=useState(false),[active,setActive]=useState("Dashboard"),[pageOptions,setPageOptions]=useState({}),[role,setRole]=useState("Admin");
  const navigate=(key,options={})=>{if(!canView(role,key)){setActive("PortalInfo");setPageOptions({title:"Access not available in this role preview",titleMr:"या भूमिकेच्या पूर्वदृश्यात प्रवेश उपलब्ध नाही"});return;}setActive(key);setPageOptions(options);window.scrollTo({top:0});};
  const Page=pages[active];
  return <div className="design-system portal-design"><Feedback/>{!login?<SchoolLogin settings={settings} onLogin={()=>{setLogin(true);setActive("Dashboard");setPageOptions({});setRole("Admin")}}/>:<PortalShell settings={settings} active={active} role={role} onRole={setRole} onNavigate={navigate} onLogout={()=>setLogin(false)}><PageBoundary key={active}>{active==="Dashboard"?<PortalHome settings={settings} role={role} onNavigate={navigate}/>:active==="TeacherDashboard"?<TeacherDashboard onNavigate={navigate}/>:active==="Settings"?<Settings onSaved={setSettings}/>: ["Inventory","Timetable","Calendar","Staff"].includes(active)?<SchoolOperations key={active} module={active}/>:Page?<Page key={active+JSON.stringify(pageOptions)} {...pageOptions} settings={settings} role={role} onNavigate={navigate}/>:<OperationalModules key={active} module={active}/>}</PageBoundary></PortalShell>}</div>;
}
