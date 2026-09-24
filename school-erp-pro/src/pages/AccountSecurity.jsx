import { useState } from 'react';
import { changePassword, authMessage } from '../backend/productionAuth';
import MemberPermissions from '../components/MemberPermissions';
import {demoRequest} from '../backend/demoClient';
import {developmentLogout} from '@development-auth';

export default function AccountSecurity({ session }) {
  const [visible, setVisible] = useState(false), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault(); const form = event.currentTarget, data = new FormData(form);
    if (data.get('next') !== data.get('confirm')) { setMessage('New passwords do not match.'); return; }
    setBusy(true);
    try { if(session.development){await demoRequest('password',{current:data.get('current'),next:data.get('next')});developmentLogout();}else await changePassword(data.get('current'), data.get('next')); form.reset(); }
    catch (error) { setMessage(error.code ? authMessage(error) : error.message); }
    finally { setBusy(false); }
  };
  if(session.development&&session.uid==='development-admin') return <section className="school-panel workflow-panel"><h2>Development account</h2><p>DEVELOPMENT / TEST MODE. The fixed demo owner credential remains active. Manage individual demo staff accounts in Users & Permissions. Production Firebase is unchanged.</p><ul>{session.modules.map(module=><li key={module}>{module}</li>)}</ul></section>;
  return <section className="school-panel workflow-panel"><h2>Account security</h2><p>{session.email} · {session.role}</p>
    <h3>Change Password</h3><form onSubmit={submit}><div className="form-grid">
      {[['current','Current password'],['next','New password'],['confirm','Confirm new password']].map(([name,label]) => <label key={name}>{label}<input required name={name} type={visible ? 'text' : 'password'} autoComplete={name === 'current' ? 'current-password' : 'new-password'} minLength={name === 'current' ? undefined : 12} maxLength={128}/></label>)}
    </div><p>Use at least 12 characters. A password change signs you out.</p><button type="button" onClick={() => setVisible(!visible)}>{visible ? 'Hide passwords' : 'Show passwords'}</button><button disabled={busy}>Change Password</button><p role="status">{message}</p></form>
    <h3>Assigned module permissions</h3><p>These permissions come from your school membership. Contact your administrator to change them.</p><ul>{session.modules.map(module => <li key={module}>{module}</li>)}</ul>
    {!session.development&&<MemberPermissions session={session}/>}
  </section>;
}
