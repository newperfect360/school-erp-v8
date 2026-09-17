import { useState } from "react";
import Icon from "../components/Icon";
import { DownloadAppCard } from './DownloadApp';
import { academicYear, useLanguage } from "../design/language";
import { CampusIllustration, LanguageSwitch, SchoolMark } from "../design/SchoolUI";

export default function SchoolLogin({ settings, onLogin }) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [help, setHelp] = useState(false);
  const submit = event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    // Retain existing LOCAL review access. This is not production authentication.
    if (data.get("username") === "admin" && data.get("password") === "123456") onLogin();
    else setError(t("The username or password is incorrect. Please try again.", "वापरकर्ता नाव किंवा पासवर्ड चुकीचा आहे. पुन्हा प्रयत्न करा."));
  };
  return <div className="academic-login">
    <aside className="login-campus">
      <div className="login-school-brand"><SchoolMark logo={settings.logo} large /><div><strong>{settings.schoolName}</strong><span>{t("SECONDARY & HIGHER SECONDARY SCHOOL", "माध्यमिक व उच्च माध्यमिक विद्यालय")}</span></div></div>
      <div className="campus-message"><span className="academic-eyebrow">{t("ONE SCHOOL. A WORLD OF POSSIBILITIES.", "एक शाळा. असंख्य शक्यता.")}</span><h1>{t("A little more time", "शिक्षणासाठी वेळ.")}<br /><em>{t("for what matters.", "प्रगतीसाठी साथ.")}</em></h1><p>{t("Bring your school day together. More connection, less paperwork, and every student in focus.", "शाळेचे प्रत्येक काम एकाच ठिकाणी. अधिक संवाद, कमी कागदपत्रे आणि प्रत्येक विद्यार्थ्याच्या प्रगतीकडे लक्ष.")}</p></div>
      <CampusIllustration />
      <div className="campus-caption"><span>{t("Learning · Growing · Together", "शिकूया · घडूया · एकत्र")}</span><span>{settings.address}</span></div>
    </aside>
    <main className="academic-login-main"><div className="login-topline"><span>{t("School management portal", "शालेय व्यवस्थापन पोर्टल")}</span><LanguageSwitch /></div>
      <form className="academic-login-form" onSubmit={submit}>
        <p className="local-review-note">{t("LOCAL SCHOOL REVIEW · cloud sign-in and OTP are not connected", "स्थानिक शालेय परीक्षण · Cloud प्रवेश व OTP जोडलेले नाहीत")}</p>
        <span className="login-emblem"><Icon name="cap" size={28} /></span><span className="academic-eyebrow">{t("YOUR SCHOOL DAY STARTS HERE", "आपल्या शालेय दिवसाची सुरुवात")}</span>
        <h2>{t("Welcome back.", "आपले स्वागत आहे.")}</h2><p>{t("Sign in to your school workspace.", "आपल्या शालेय कार्यस्थानात प्रवेश करा.")}</p>
        <label>{t("Username", "वापरकर्ता नाव")}<div className="input-with-icon"><Icon name="users" size={18} /><input name="username" aria-label="Username" autoComplete="username" placeholder={t("Enter your username", "वापरकर्ता नाव लिहा")} required onChange={() => setError("")} /></div></label>
        <label>{t("Password", "पासवर्ड")}<div className="input-with-icon"><Icon name="lock" size={18} /><input name="password" aria-label="Password" autoComplete="current-password" type={visible ? "text" : "password"} placeholder={t("Enter your password", "पासवर्ड लिहा")} required onChange={() => setError("")} /><button type="button" className="icon-button" aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} onClick={() => setVisible(!visible)}><Icon name="eye" size={18} /></button></div></label>
        <button type="button" className="login-help text-button" onClick={() => setHelp(!help)} aria-expanded={help}>{t("Need help signing in?", "प्रवेशासाठी मदत हवी आहे?")}</button>
        {help && <p className="inline-notice">{t("Please contact your school administrator for account assistance. Online password recovery is not yet configured.", "खात्यासंबंधी मदतीसाठी शाळेच्या प्रशासकाशी संपर्क साधा. ऑनलाइन पासवर्ड पुनर्प्राप्ती अद्याप उपलब्ध नाही.")}</p>}
        {error && <p className="inline-error" role="alert">{error}</p>}
        <button type="submit" className="school-button login-submit" aria-label="Login">{t("Sign in to school", "शाळेत प्रवेश करा")}<Icon name="arrow" size={18} /></button>
        <div className="login-academic-year"><Icon name="calendar" size={17} />{t("Academic year", "शैक्षणिक वर्ष")} <strong>{academicYear(settings)}</strong></div>
      </form>
      <div className="login-bottomline"><SchoolMark logo={settings.logo} /><p>{settings.schoolName}<span>{settings.address}</span></p></div>
    <DownloadAppCard/></main>
  </div>;
}
