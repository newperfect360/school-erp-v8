import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { schoolFirebase } from '../backend/firebaseClient';

const roles = ['Admin','Headmaster','Teacher','Class Teacher','Subject Teacher','Clerk','Office Staff','Sports Teacher','Trip In-charge','Library Staff','Accounts Staff'];
export default function MemberPermissions({ session }) {
  const [members, setMembers] = useState([]), [draft, setDraft] = useState(null), [message, setMessage] = useState(''), [busy, setBusy] = useState(false);
  const administrator = ['Admin','Super Admin'].includes(session.role);
  useEffect(() => {
    if (!administrator) return;
    const { db, schoolId } = schoolFirebase();
    return onSnapshot(collection(db, 'schools', schoolId, 'members'), rows => setMembers(rows.docs.map(row => ({ ...row.data(), uid: row.id }))), () => setMessage('Memberships could not be loaded.'));
  }, [administrator]);
  if (!administrator) return null;
  const save = async () => {
    if (!draft || busy) return;
    setBusy(true); setMessage('');
    try {
      const { db, schoolId } = schoolFirebase();
      await updateDoc(doc(db, 'schools', schoolId, 'members', draft.uid), {
        role: draft.role, active: draft.active, modules: draft.modules, resources: draft.resources,
        classIds: draft.classIds, studentIds: draft.studentIds,
      });
      setDraft(null); setMessage('Permissions saved to the school backend.');
    } catch { setMessage('Permission update was not accepted by the school backend.'); }
    finally { setBusy(false); }
  };
  return <section><h3>Staff roles and permissions</h3><p>Only existing school memberships appear here. The main Super Admin and your own permissions cannot be changed here. Password activation remains a trusted administrator setup step.</p>
    <label>Staff account<select aria-label="Staff account" value={draft?.uid || ''} onChange={event => { const member = members.find(row => row.uid === event.target.value); setDraft(member ? { ...member, modules: member.modules || [], resources: member.resources || [], classIds: member.classIds || [], studentIds: member.studentIds || [] } : null); }}>
      <option value="">Select staff</option>{members.filter(member => member.uid !== session.uid && member.role !== 'Super Admin' && (session.role === 'Super Admin' || member.role !== 'Admin')).map(member => <option key={member.uid} value={member.uid}>{member.email || member.uid} · {member.role}</option>)}
    </select></label>
    {draft && <><label>Role<select value={draft.role} onChange={event => setDraft({ ...draft, role: event.target.value })}>{roles.filter(role => role !== 'Admin' || session.role === 'Super Admin').map(role => <option key={role}>{role}</option>)}</select></label>
      <label><input type="checkbox" checked={!!draft.active} onChange={event => setDraft({ ...draft, active: event.target.checked })}/>Active account</label>
      {['modules','resources'].map(key => <fieldset key={key}><legend>{key === 'modules' ? 'Visible modules' : 'Backend resource grants'}</legend>{session[key].map(value => <label key={value}><input type="checkbox" checked={draft[key].includes(value)} onChange={event => setDraft({ ...draft, [key]: event.target.checked ? [...draft[key], value] : draft[key].filter(item => item !== value) })}/>{value}</label>)}</fieldset>)}
      <p>Class and student assignments are preserved. Resource grants remain subject to backend role and class restrictions.</p><button disabled={busy} onClick={save}>Save staff permissions</button></>}
    <p role="status">{message}</p>
  </section>;
}
