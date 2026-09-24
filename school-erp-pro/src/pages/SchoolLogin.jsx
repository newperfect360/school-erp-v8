import { useState } from "react";
import {developmentEnabled,developmentLogin} from '@development-auth';
import { signIn, forgotPassword, resetPassword, authMessage } from "../backend/productionAuth";
import {identifySchool,tenantAuthEnabled} from '../backend/tenantAuth';
import Icon from "../components/Icon";
import { DownloadAppCard } from './DownloadApp';
import { academicYear, useLanguage } from "../design/language";
import { CampusIllustration, LanguageSwitch } from "../design/SchoolUI";

export default function SchoolLogin({ settings, status }) {
  const [udise,setUdise]=useState(''),[school,setSchool]=useState(null);
  async function lookup(){setSchool(null);if(!udise.trim())return;try{if(!developmentEnabled){setSchool(await identifySchool(udise));setError('');return;}const response=await fetch('/__school_demo/resolve-school',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({udise})});const result=await response.json();if(!response.ok)throw Error(result.error);setSchool(result.school);setError('');}catch(e){setError(e.message);}}
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState(new URLSearchParams(location.search).get('mode') === 'resetPassword' ? 'reset' : 'login');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const submit = async event => {
    event.preventDefault(); const form = event.currentTarget, data = new FormData(form);
    setBusy(true); setError(''); setMessage('');
    try {
      if(!developmentEnabled&&mode==='login'&&(!tenantAuthEnabled||!/^\d{11}$/.test(udise.trim())))throw Error('Enter a valid school UDISE to identify your school.');
      if (developmentEnabled) { await developmentLogin(data.get('email'),data.get('password'),udise); history.replaceState(null,'','/school'); form.reset(); return; }
      if (mode === 'forgot') { await forgotPassword(data.get('email')); setMessage('If this account is eligible, a reset link will be sent to its email address.'); }
      else if (mode === 'reset') {
        if (data.get('password') !== data.get('confirm')) throw Error('Passwords do not match.');
        await resetPassword(new URLSearchParams(location.search).get('oobCode'), data.get('password'));
        history.replaceState(null, '', location.pathname); setMode('login'); form.reset(); setMessage('Password reset. Sign in with your new password.');
      } else { await signIn(data.get('email'), data.get('password'),udise); form.reset(); }
    } catch (error) { setError(error.code ? authMessage(error) : error.message); }
    finally { setBusy(false); }
  };
  return <div className="academic-login">
    <aside className="login-campus">
      <div className="login-school-brand"><div><strong>PerfectEdu</strong><span>www.perfectedu.co.in</span><span>School Management Platform</span></div></div>
      <div className="campus-message"><span className="academic-eyebrow">{t("ONE SCHOOL. A WORLD OF POSSIBILITIES.", "एक शाळा. असंख्य शक्यता.")}</span><h1>{t("A little more time", "शिक्षणासाठी वेळ.")}<br /><em>{t("for what matters.", "प्रगतीसाठी साथ.")}</em></h1><p>{t("Bring your school day together. More connection, less paperwork, and every student in focus.", "शाळेचे प्रत्येक काम एकाच ठिकाणी. अधिक संवाद, कमी कागदपत्रे आणि प्रत्येक विद्यार्थ्याच्या प्रगतीकडे लक्ष.")}</p></div>
      <CampusIllustration />
      <div className="campus-caption"><span>{t("Learning · Growing · Together", "शिकूया · घडूया · एकत्र")}</span><span>PerfectEdu</span></div>
    </aside>
    <main className="academic-login-main"><div className="login-topline"><span>{t("School management portal", "शालेय व्यवस्थापन पोर्टल")}</span><LanguageSwitch /></div>
      <form className="academic-login-form" onSubmit={submit}>
        <h2>{developmentEnabled ? 'PerfectEdu School Login' : mode === 'forgot' ? 'Forgot Password' : mode === 'reset' ? 'Reset Password' : t('Welcome back.', 'Welcome back.')}</h2>
        <p>{developmentEnabled ? 'DEVELOPMENT / TEST MODE — local test records only.' : 'Sign in with your authorized school email account.'}</p>
        <label>{t('School UDISE Code','शाळेचा UDISE कोड')}<input name="udise" aria-label="School UDISE Code" value={udise} onChange={e=>{setUdise(e.target.value);setSchool(null);}} onBlur={lookup} autoComplete="organization"/></label><p>{developmentEnabled?'Existing GBS development owner may leave UDISE blank. Other users must enter their school code.':''}</p>{school&&<div className="perfectedu-school-preview">{school.logo&&<img src={school.logo} alt="School logo"/>}<strong>{school.schoolNameEn||school.schoolNameMr}</strong><p>{school.address}</p></div>}{mode !== 'reset' && <label>{mode==='forgot' ? 'Email' : 'User ID / Email / Mobile'}<input name="email" aria-label={developmentEnabled ? 'Username' : 'Email'} type={mode==='forgot' ? 'email' : 'text'} autoComplete="username" required /></label>}
        {mode !== 'forgot' && <label>{mode === 'reset' ? 'New password' : 'Password'}<div className="input-with-icon"><input name="password" aria-label="Password" autoComplete={mode === 'reset' ? 'new-password' : 'current-password'} type={visible ? 'text' : 'password'} minLength={mode === 'reset' ? 12 : undefined} required /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={()=>setVisible(!visible)}>{visible ? 'Hide' : 'Show'}</button></div></label>}
        {mode === 'reset' && <label>Confirm new password<input name="confirm" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={12} required /></label>}
        {developmentEnabled&&<button type="button" onClick={()=>setMessage('For this development school account, contact your School Admin to reset access. Firebase passwords are unchanged.')}>Forgot Password</button>}{!developmentEnabled && <button type="button" className="login-help text-button" onClick={()=>{setMode(mode === 'login' ? 'forgot' : 'login');setError('');setMessage('')}}>{mode === 'login' ? 'Forgot Password' : 'Back to Login'}</button>}
        {status && <p role="status">{status}</p>}{message && <p role="status">{message}</p>}
        {error && <p className="inline-error" role="alert">{error}</p>}
        <button type="submit" className="school-button login-submit" disabled={busy} aria-label={mode === 'login' ? 'Login' : 'Submit password request'}>{mode === 'login' ? 'Sign in to school' : mode === 'forgot' ? 'Send reset link' : 'Reset Password'}</button>
        <div className="login-academic-year"><Icon name="calendar" size={17} />{t("Academic year", "शैक्षणिक वर्ष")} <strong>{academicYear(settings)}</strong></div>
      </form>
      <div className="login-bottomline"><p>PerfectEdu ? www.perfectedu.co.in</p><a href="/platform-admin/login">Platform Admin</a></div>
    <DownloadAppCard/></main>
  </div>;
}
