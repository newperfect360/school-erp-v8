import { useEffect, useRef, useState } from 'react';
import { previewMovements, commitMovements } from '../services/lifecycleStore';
import { localDate } from '../storage';
import { academicYears } from '../services/academicYears';
import { notify } from './Feedback';

export function StudentActions({ student, onView, onEdit, onArchive, onAction }) {
  return <div className="student-record-actions">
    {onView && <button aria-label={`View profile ${student.grNo}`} onClick={() => onView(student.id)}>View</button>}
    <button onClick={() => onEdit(student.id)}>Edit</button>
    <button aria-label={student.archivedAt ? 'Restore student' : 'Archive student'} onClick={() => onArchive(student.id)}>{student.archivedAt ? 'Restore' : 'Archive'}</button>
    <div className="student-visible-actions" aria-label={`Student actions ${student.grNo}`}>
      {['Change Class', 'Change Division', 'Change Academic Year', 'Promote', 'School Left', 'Delete'].map(action => <button key={action} onClick={() => onAction(student, action)}>{action}</button>)}
    </div>
  </div>;
}

export default function StudentChangeDialog({ student, action, role, onClose, onSaved }) {
  const dialog = useRef(null);
  const [form, setForm] = useState({ className: student.className || '', division: student.division || '', rollNo: student.rollNo || '', academicYear: student.academicYear || '', reason: '', leavingDate: localDate(), lcNumber: '', lcIssueDate: '', remarks: '' });
  const [preview, setPreview] = useState(null), [checked, setChecked] = useState(false), [error, setError] = useState('');
  useEffect(() => { const node = dialog.current; node.showModal(); return () => node.close(); }, []);
  const update = (key, value) => { setForm({ ...form, [key]: value }); setPreview(null); setChecked(false); setError(''); };
  const prepare = () => {
    try {
      const mapped = { 'Change Class': 'Class Transfer', 'Change Division': 'Class Transfer', 'Change Roll Number': 'Class Transfer', 'Change Academic Year': 'Academic Year Change', Delete: 'Delete Student' }[action] || action;
      if (['Promote', 'Change Academic Year'].includes(action) && academicYears().some(y => y.id === form.academicYear && y.status !== 'Open')) throw Error('Choose an open academic year.');
      setPreview(previewMovements([student.id], { ...form, action: mapped })); setChecked(false); setError('');
    } catch (e) { setError(e.message); }
  };
  const confirm = () => {
    if (!checked || !preview) return;
    try { commitMovements(preview); notify('Student change saved. Linked records and previous enrollment retained.'); onSaved(); }
    catch (e) { setError(e.message); }
  };
  return <dialog ref={dialog} className="student-change-dialog" onCancel={onClose} aria-labelledby="student-change-title">
    <header><div><small>STUDENT RECORD · GR {student.grNo}</small><h2 id="student-change-title">{action === 'Delete' ? 'Delete student · safe archive' : action}</h2><p>{student.name} · {student.academicYear || 'Year not recorded'} · Class {student.className}/{student.division || '—'}</p></div><button aria-label="Close student action" onClick={onClose}>×</button></header>
    <div className="student-change-body">
      {action === 'Delete' && <p className="student-safety-note">This archives the student; it does not permanently delete the record. Attendance, results, fees, certificates, parent communication and academic history stay linked to the same student ID.</p>}
      <div className="form-grid">
        {action === 'Change Class' && <label>New standard<input aria-label="New standard" value={form.className} onChange={e => update('className', e.target.value)}/></label>}
        {['Change Class', 'Change Division', 'Promote'].includes(action) && <label>New division<input aria-label="New division" value={form.division} onChange={e => update('division', e.target.value)}/></label>}
        {['Change Class', 'Change Division', 'Change Roll Number', 'Promote'].includes(action) && <label>New roll number<input aria-label="New roll number" value={form.rollNo} onChange={e => update('rollNo', e.target.value)}/></label>}
        {['Promote', 'Change Academic Year'].includes(action) && <label>Destination academic year<input aria-label="Destination academic year" placeholder="2027-28" list="student-action-years" value={form.academicYear} onChange={e => update('academicYear', e.target.value)}/><datalist id="student-action-years">{academicYears().filter(y => y.status === 'Open').map(y => <option key={y.id} value={y.id}/>)}</datalist></label>}
        {action === 'School Left' && <><label>Last class<input value={student.className} readOnly/></label>{[['Date of Leaving','leavingDate'],['LC Number','lcNumber'],['LC Date','lcIssueDate'],['Remarks','remarks']].map(([label,key]) => <label key={key}>{label}<input type={key.endsWith('Date') ? 'date' : 'text'} value={form[key]} onChange={e => update(key,e.target.value)}/></label>)}</>}
        <label className="form-full">Reason for change<input aria-label="Reason for change" value={form.reason} onChange={e => update('reason', e.target.value)}/></label>
      </div>
      {error && <p className="inline-error" role="alert">{error}</p>}
      <button className="school-button secondary" onClick={prepare}>Preview change</button>
      {preview && <section className="student-change-preview"><h3>Review before saving</h3><div className="table-scroll"><table><thead><tr><th>Field</th><th>Current</th><th>After change</th></tr></thead><tbody>{Object.keys(preview.plans[0].movement.newValue).map(key => <tr key={key}><th>{({className:'Standard',academicYear:'Academic year',division:'Division',rollNo:'Roll number',status:'Status'})[key]}</th><td>{preview.plans[0].movement.oldValue[key] || '—'}</td><td>{preview.plans[0].movement.newValue[key] || '—'}</td></tr>)}</tbody></table></div><label className="review-ack"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)}/>I reviewed this student and the proposed change.</label><button className="school-button" disabled={!checked} onClick={confirm}>{action === 'Delete' ? 'Confirm archive' : 'Confirm student change'}</button></section>}
      {role === 'Super Admin' && action === 'Delete' && <p className="student-safety-note">Permanent Delete is locked. A role preview cannot authorize permanent deletion; verified server Super Admin access and a separate confirmation are required.</p>}
    </div>
  </dialog>;
}
